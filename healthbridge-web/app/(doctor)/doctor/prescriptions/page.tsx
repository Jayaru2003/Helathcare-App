"use client";
import { useEffect, useState, useCallback } from "react";
import { prescriptionService, type CreatePrescriptionDto } from "@/services/prescription.service";
import { useAuthStore }    from "@/store/auth.store";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }           from "@/components/ui/Badge";
import { Button }          from "@/components/ui/Button";
import { Modal }           from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState }      from "@/components/ui/EmptyState";
import { PageLoader }      from "@/components/ui/Spinner";
import { Plus, Pill, Trash2 } from "lucide-react";
import { formatDate, statusVariant } from "@/lib/utils";
import type { Prescription, Medication } from "@/types";

const emptyMed: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "", quantity: 1 };

export default function DoctorPrescriptionsPage() {
  const { user }              = useAuthStore();
  const [rxs,    setRxs]      = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm]       = useState<Partial<CreatePrescriptionDto>>({
    patientId: "", doctorId: "", diagnosis: "", notes: "", medications: [{ ...emptyMed }],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await prescriptionService.getAll(1, 20);
      setRxs(res.data ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMed = () => setForm(f => ({ ...f, medications: [...(f.medications ?? []), { ...emptyMed }] }));
  const removeMed = (i: number) => setForm(f => ({ ...f, medications: f.medications?.filter((_, idx) => idx !== i) }));
  const setMed = (i: number, k: keyof Medication, v: string | number) =>
    setForm(f => ({ ...f, medications: f.medications?.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await prescriptionService.create({ ...form, doctorId: form.doctorId || user?.id || "" } as CreatePrescriptionDto);
      setModal(false);
      setForm({ patientId: "", doctorId: "", diagnosis: "", notes: "", medications: [{ ...emptyMed }] });
      load();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-400">Create and manage patient prescriptions</p>
        </div>
        <Button id="new-prescription-btn" onClick={() => setModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
          New Prescription
        </Button>
      </div>

      <Card>
        {loading ? <PageLoader /> : rxs.length === 0 ? (
          <EmptyState icon={Pill} title="No prescriptions" message="Write your first prescription using the button above." action={<Button size="sm" onClick={() => setModal(true)}>Write Prescription</Button>} />
        ) : (
          <CardSection>
            {rxs.map(rx => (
              <div key={rx._id} className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {rx.diagnosis ?? "Prescription #" + rx._id.slice(-6)}
                    </p>
                    <p className="text-xs text-slate-400">Issued: {formatDate(rx.issuedAt)}</p>
                  </div>
                  <Badge label={rx.status} variant={statusVariant(rx.status) as any} dot />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rx.medications?.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                      <Pill className="h-3 w-3" /> {m.name} · {m.dosage}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardSection>
        )}
      </Card>

      {/* Create Prescription Modal */}
      <Modal open={modal} onOpenChange={setModal} title="Write Prescription" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="rx-patient" label="Patient ID" value={form.patientId ?? ""} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required placeholder="Patient UUID" />
            <Input id="rx-appt"   label="Appointment ID (optional)" value={form.appointmentId ?? ""} onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))} placeholder="Appointment UUID" />
          </div>
          <Input id="rx-diagnosis" label="Diagnosis" value={form.diagnosis ?? ""} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g., Hypertension" />

          {/* Medications */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Medications <span className="text-red-400">*</span></p>
              <Button type="button" size="xs" variant="outline" onClick={addMed} leftIcon={<Plus className="h-3 w-3" />}>Add medication</Button>
            </div>
            <div className="space-y-3">
              {form.medications?.map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input id={`med-name-${i}`}    placeholder="Drug name"   value={m.name}      onChange={e => setMed(i, "name",      e.target.value)} required />
                    <Input id={`med-dosage-${i}`}  placeholder="Dosage"      value={m.dosage}    onChange={e => setMed(i, "dosage",    e.target.value)} required />
                    <Input id={`med-freq-${i}`}    placeholder="Frequency"   value={m.frequency} onChange={e => setMed(i, "frequency", e.target.value)} required />
                    <Input id={`med-dur-${i}`}     placeholder="Duration"    value={m.duration}  onChange={e => setMed(i, "duration",  e.target.value)} required />
                  </div>
                  {(form.medications?.length ?? 0) > 1 && (
                    <button type="button" onClick={() => removeMed(i)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Textarea id="rx-notes" label="Notes" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional instructions…" rows={2} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Issue Prescription</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
