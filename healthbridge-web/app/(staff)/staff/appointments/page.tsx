"use client";
import { useEffect, useState, useCallback } from "react";
import { appointmentService, type CreateAppointmentDto } from "@/services/appointment.service";
import { Card, CardSection }   from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { Modal }               from "@/components/ui/Modal";
import { Input, Textarea }     from "@/components/ui/Input";
import { Select }              from "@/components/ui/Select";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Pagination }          from "@/components/ui/Pagination";
import { Plus, Building2, Video, Phone, CheckCircle, XCircle } from "lucide-react";
import { friendlyDate, formatDateTime, statusVariant } from "@/lib/utils";
import type { Appointment }    from "@/types";
import { APPOINTMENT_TYPES }   from "@/lib/config";

const typeIcon: Record<string, React.ElementType> = { in_person: Building2, video: Video, phone: Phone };

export default function StaffAppointmentsPage() {
  const [appts, setAppts]   = useState<Appointment[]>([]);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(1);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState<Partial<CreateAppointmentDto>>({ patientId: "", doctorId: "", scheduledAt: "", type: "in_person", reason: "", durationMinutes: 30 });
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const res = await appointmentService.getAll(page, LIMIT);
      setAppts(res.data ?? []);
      setTotal(res.meta?.totalPages ?? 1);
    } catch {}
    setLoad(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentService.create(form as CreateAppointmentDto);
      setModal(false);
      setForm({ patientId: "", doctorId: "", scheduledAt: "", type: "in_person", reason: "", durationMinutes: 30 });
      load();
    } catch {}
    setSaving(false);
  };

  const handleAction = async (id: string, action: "complete" | "cancel") => {
    try {
      if (action === "complete") await appointmentService.complete(id);
      else await appointmentService.cancel(id);
      load();
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-400">Schedule and manage all appointments</p>
        </div>
        <Button id="staff-new-appt-btn" onClick={() => setModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Book Appointment
        </Button>
      </div>

      <Card>
        {loading ? <PageLoader /> : appts.length === 0 ? (
          <EmptyState type="calendar" title="No appointments" message="Book the first appointment using the button above." action={<Button size="sm" onClick={() => setModal(true)}>Book Now</Button>} />
        ) : (
          <>
            <CardSection>
              {appts.map(a => {
                const TypeIcon = typeIcon[a.type] ?? Building2;
                return (
                  <div key={a.id} className="flex items-center gap-4 py-3.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50">
                      <TypeIcon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.reason}</p>
                      <p className="text-xs text-slate-400">
                        {friendlyDate(a.scheduledAt)} · {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.durationMinutes}m
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={a.status} variant={statusVariant(a.status) as any} dot />
                      {a.status === "scheduled" && (
                        <>
                          <Button size="xs" variant="success" onClick={() => handleAction(a.id, "complete")} leftIcon={<CheckCircle className="h-3 w-3" />}>Done</Button>
                          <Button size="xs" variant="outline" onClick={() => handleAction(a.id, "cancel")}   leftIcon={<XCircle className="h-3 w-3" />}>Cancel</Button>
                        </>
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

      <Modal open={modal} onOpenChange={setModal} title="Book Appointment" description="Schedule an appointment for a patient" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="staff-patient-id" label="Patient ID"  value={form.patientId ?? ""} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required placeholder="Patient UUID" />
            <Input id="staff-doctor-id"  label="Doctor ID"   value={form.doctorId  ?? ""} onChange={e => setForm(f => ({ ...f, doctorId:  e.target.value }))} required placeholder="Doctor UUID"  />
          </div>
          <Input id="staff-apt-date" label="Date & Time" type="datetime-local" value={form.scheduledAt ?? ""} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))} options={APPOINTMENT_TYPES.map(t => ({ value: t.value, label: t.label }))} />
            <Input id="staff-duration" label="Duration (min)" type="number" value={String(form.durationMinutes ?? 30)} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} />
          </div>
          <Textarea id="staff-reason" label="Reason" value={form.reason ?? ""} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Reason for appointment…" rows={2} />
          <Input id="staff-fee" label="Fee (USD)" type="number" value={String(form.fee ?? 0)} onChange={e => setForm(f => ({ ...f, fee: Number(e.target.value) }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Book Appointment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
