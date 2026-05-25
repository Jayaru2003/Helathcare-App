"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, Mail, Lock, User, Phone, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button }   from "@/components/ui/Button";
import { Input }    from "@/components/ui/Input";
import { cn }       from "@/lib/utils";

type Role = "patient" | "doctor" | "staff";

const roles: { value: Role; label: string; desc: string; emoji: string }[] = [
  { value: "patient", label: "Patient",      desc: "Book & manage appointments",      emoji: "🏥" },
  { value: "doctor",  label: "Doctor",       desc: "Manage patients & prescriptions", emoji: "👨‍⚕️" },
  { value: "staff",   label: "Staff",        desc: "Reception & scheduling",          emoji: "📋" },
];

export default function RegisterPage() {
  const [step, setStep]           = useState(1);
  const [success, setSuccess]     = useState(false);
  const [form, setForm]           = useState({
    firstName: "", lastName: "", email: "",
    password: "", phoneNumber: "", role: "patient" as Role,
  });

  const { register, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {}
  };

  if (success) {
    return (
      <div className="w-full max-w-[400px] animate-fade-up text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Account created!</h1>
        <p className="mt-2 text-sm text-slate-500">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] animate-fade-up">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 shadow-lg shadow-brand-200">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Join HealthBridge today</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Input id="reg-first-name" label="First name" value={form.firstName} onChange={set("firstName")} required placeholder="John" leftAddon={<User className="h-4 w-4" />} />
            <Input id="reg-last-name"  label="Last name"  value={form.lastName}  onChange={set("lastName")}  required placeholder="Doe" />
          </div>

          <Input id="reg-email" label="Email" type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" leftAddon={<Mail className="h-4 w-4" />} />
          <Input id="reg-phone" label="Phone number" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+1 (555) 000-0000" leftAddon={<Phone className="h-4 w-4" />} hint="Optional — used for appointment reminders" />
          <Input id="reg-password" label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="At least 8 characters" leftAddon={<Lock className="h-4 w-4" />} hint="Minimum 8 characters" />

          {/* Role selector */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              I am a… <span className="text-red-400">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(({ value, label, desc, emoji }) => (
                <button
                  key={value}
                  type="button"
                  id={`reg-role-${value}`}
                  onClick={() => { clearError(); setForm(f => ({ ...f, role: value })); }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-150",
                    form.role === value
                      ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className={cn("text-xs font-semibold", form.role === value ? "text-brand-700" : "text-slate-700")}>
                    {label}
                  </span>
                  <span className="text-[10px] leading-tight text-slate-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" id="register-submit-btn" loading={isLoading} className="mt-2 w-full" size="lg">
            Create account
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
