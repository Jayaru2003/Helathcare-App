"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { roleDashboard } from "@/lib/utils";
import type { Metadata } from "next";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const { login, isLoading, error, user, hydrate, clearError } = useAuthStore();
  const router = useRouter();

  useEffect(() => { hydrate(); }, []);
  useEffect(() => {
    if (user) router.push(roleDashboard(user.role));
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try { await login({ email, password }, router); } catch {}
  };

  return (
    <div className="w-full max-w-[400px] animate-fade-up">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 shadow-lg shadow-brand-200">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to your HealthBridge account</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
            leftAddon={<Mail className="h-4 w-4" />}
          />

          <Input
            id="login-password"
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftAddon={<Lock className="h-4 w-4" />}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="cursor-pointer transition hover:text-slate-600"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            id="login-submit-btn"
            loading={isLoading}
            className="mt-2 w-full"
            size="lg"
          >
            Sign in
          </Button>
        </form>

        {/* Demo hint */}
        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">💡 Test accounts</p>
          <p>Register a new account to get started. Choose your role on the register page.</p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline underline-offset-2">
          Create one
        </Link>
      </p>
    </div>
  );
}
