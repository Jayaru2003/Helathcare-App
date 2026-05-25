"use client";
import { useEffect, useState, useCallback } from "react";
import { appointmentService, type CreateAppointmentDto } from "@/services/appointment.service";
import { useAuthStore }        from "@/store/auth.store";
import { Card, CardSection }   from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { Modal }               from "@/components/ui/Modal";
import { Input, Textarea }     from "@/components/ui/Input";
import { Select }              from "@/components/ui/Select";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Pagination }          from "@/components/ui/Pagination";
import { Plus, Building2, Video, Phone, XCircle } from "lucide-react";
import { friendlyDate, statusVariant } from "@/lib/utils";
import type { Appointment }    from "@/types";
import { APPOINTMENT_TYPES }   from "@/lib/config";

const typeIcon: Record<string, React.ElementType> = { in_person: Building2, video: Video, phone: Phone };

export default function PatientAppointmentsPage() {
  const { user }            = useAuthStore();
  const [appts, setAppts]   = useState<Appointment[]>([]);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(1);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState<Partial<CreateAppointmentDto>>({ doctorId: "", scheduledAt: "", type: "in_person", reason: "", durationMinutes: 30 });
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const res = await appointmentService.getAll(page, LIMIT, user?.id ? { patientId: user.id } : undefined);
      setAppts(res.data ?? []);
      setTotal(res.meta?.totalPages ?? 1);
    } catch {}
    setLoad(false);
  }, [page, user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await appointmentService.create({ ...form, patientId: user.id } as CreateAppointmentDto);
      setModal(false);
      setForm({ doctorId: "", scheduledAt: "", type: "in_person", reason: "", durationMinutes: 30 });
      load();
    } catch {}
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    try { await appointmentService.cancel(id, "Cancelled by patient"); load(); } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-400">View and manage your appointments</p>
        </div>
        <Button id="book-appointment-btn" onClick={() => setModal(true)} leftIcon={<Plus className="h-4 w-4" />}>Book Appointment</Button>
      </div>

      <Card>
        {loading ? <PageLoader /> : appts.length === 0 ? (
          <EmptyState type="calendar" title="No appointments" message="Book your first appointment with a doctor." action={<Button size="sm" onClick={() => setModal(true)}>Book Now</Button>} />
        ) : (
          <>
            <CardSection>
              {appts.map(a => {
                const TypeIcon = typeIcon[a.type] ?? Building2;
                return (
                  <div key={a.id} className="flex items-center gap-4 py-3.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <TypeIcon className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.reason}</p>
                      <p className="text-xs text-slate-400">
                        {friendlyDate(a.scheduledAt)} · {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.durationMinutes}m
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={a.status} variant={statusVariant(a.status) as any} dot />
                      {(a.status === "scheduled" || a.status === "confirmed") && (
                        <Button size="xs" variant="outline" onClick={() => handleCancel(a.id)} leftIcon={<XCircle className="h-3 w-3" />}>Cancel</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardSection>
            <Pagination page={page} totalPages={total} hasNext={page < total} hasPrev={page > 1} onNext={() => setPage(p => p + 1)} onPrev={() => setPage(p => p - 1)} />
          </>
        )}
      </Card>

      <Modal open={modal} onOpenChange={setModal} title="Book Appointment" description="Schedule a new appointment with your doctor" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="pat-doctor-id" label="Doctor ID" value={form.doctorId ?? ""} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} required placeholder="Your doctor's UUID" />
          <Input id="pat-apt-date"  label="Date & Time" type="datetime-local" value={form.scheduledAt ?? ""} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
          <Select label="Appointment Type" value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))} options={APPOINTMENT_TYPES.map(t => ({ value: t.value, label: t.label }))} required />
          <Textarea id="pat-reason" label="Reason for visit" value={form.reason ?? ""} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Describe your symptoms or reason…" rows={3} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Book Appointment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
