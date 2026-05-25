"use client";
import { useEffect, useState, useCallback } from "react";
import { patientService }  from "@/services/patient.service";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge }           from "@/components/ui/Badge";
import { Button }          from "@/components/ui/Button";
import { Input }           from "@/components/ui/Input";
import { Modal }           from "@/components/ui/Modal";
import { Select }          from "@/components/ui/Select";
import { EmptyState }      from "@/components/ui/EmptyState";
import { PageLoader }      from "@/components/ui/Spinner";
import { Pagination }      from "@/components/ui/Pagination";
import { Plus, Search }    from "lucide-react";
import { initials, formatDate, statusVariant } from "@/lib/utils";
import type { Patient }    from "@/types";
import { BLOOD_TYPES, GENDERS } from "@/lib/config";

const defaultForm = {
  userId: "", firstName: "", lastName: "", dateOfBirth: "",
  gender: "prefer_not_to_say", bloodType: "", phoneNumber: "", email: "",
  insuranceProvider: "", insurancePolicyNumber: "",
};

export default function StaffPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(defaultForm);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getAll(page, LIMIT);
      setPatients(res.data ?? []);
      setTotal(res.meta?.totalPages ?? 1);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientService.create({ ...form, dateOfBirth: new Date(form.dateOfBirth).toISOString() });
      setModal(false);
      setForm(defaultForm);
      load();
    } catch {}
    setSaving(false);
  };

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.email} ${p.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-400">Search, register, and manage patients</p>
        </div>
        <Button id="register-patient-btn" onClick={() => setModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Register Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Patients ({patients.length})</CardTitle>
          <div className="w-64">
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} leftAddon={<Search className="h-4 w-4" />} />
          </div>
        </CardHeader>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState type="search" title="No patients found" message="Register a new patient using the button above." />
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {filtered.map(p => (
                <div key={p.id} className="flex items-center gap-4 py-3.5 rounded-xl px-2 -mx-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-bold text-white shadow-sm">
                    {initials(p.firstName, p.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-400">{p.email} · {p.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.dateOfBirth && <p className="text-xs text-slate-400 hidden sm:block">DOB: {formatDate(p.dateOfBirth)}</p>}
                    {p.bloodType && <Badge label={p.bloodType} variant="info" size="sm" />}
                    <Badge label={p.isActive === false ? "inactive" : "active"} variant={statusVariant(p.isActive === false ? "inactive" : "active") as any} dot />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={total} hasNext={page < total} hasPrev={page > 1} onNext={() => setPage(p => p + 1)} onPrev={() => setPage(p => p - 1)} />
          </>
        )}
      </Card>

      {/* Register Patient Modal */}
      <Modal open={modal} onOpenChange={setModal} title="Register New Patient" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="pat-user-id"  label="User ID (auth userId)" value={form.userId}    onChange={set("userId")}    required placeholder="UUID from auth service" />
          <div className="grid grid-cols-2 gap-3">
            <Input id="pat-fn" label="First name" value={form.firstName}  onChange={set("firstName")}  required placeholder="Jane" />
            <Input id="pat-ln" label="Last name"  value={form.lastName}   onChange={set("lastName")}   required placeholder="Smith" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="pat-email" label="Email" type="email" value={form.email} onChange={set("email")} required placeholder="patient@email.com" />
            <Input id="pat-phone" label="Phone" type="tel"   value={form.phoneNumber} onChange={set("phoneNumber")} required placeholder="+1 555 0000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="pat-dob"  label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
            <Select label="Gender" value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))} options={GENDERS.map(g => ({ value: g.value, label: g.label }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Blood Type (opt.)" value={form.bloodType} onValueChange={v => setForm(f => ({ ...f, bloodType: v }))} options={[{ value: "", label: "Unknown" }, ...BLOOD_TYPES.map(b => ({ value: b, label: b }))]} />
            <Input id="pat-insurance" label="Insurance Provider (opt.)" value={form.insuranceProvider} onChange={set("insuranceProvider")} placeholder="e.g., BlueCross" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Register Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
