"use client";
import { useEffect, useState, useCallback } from "react";
import { prescriptionService } from "@/services/prescription.service";
import { useAuthStore }        from "@/store/auth.store";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Pill, RefreshCw }     from "lucide-react";
import { formatDate, statusVariant } from "@/lib/utils";
import type { Prescription }   from "@/types";

export default function PatientPrescriptionsPage() {
  const { user }               = useAuthStore();
  const [rxs, setRxs]          = useState<Prescription[]>([]);
  const [loading, setLoading]  = useState(true);
  const [refilling, setRefill] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await prescriptionService.getByPatient(user.id);
      setRxs(res.data ?? []);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleRefill = async (id: string) => {
    setRefill(id);
    try { await prescriptionService.requestRefill(id); load(); } catch {}
    setRefill(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">My Prescriptions</h1>
        <p className="text-sm text-slate-400">View your active and past prescriptions</p>
      </div>

      <Card>
        {loading ? <PageLoader /> : rxs.length === 0 ? (
          <EmptyState icon={Pill} title="No prescriptions" message="Your prescriptions from doctors will appear here." />
        ) : (
          <CardSection>
            {rxs.map(rx => (
              <div key={rx._id} className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {rx.diagnosis ?? "Prescription"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Issued: {formatDate(rx.issuedAt)}
                      {rx.validUntil && ` · Valid until: ${formatDate(rx.validUntil)}`}
                    </p>
                    {rx.notes && <p className="mt-1 text-xs text-slate-500">{rx.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={rx.status} variant={statusVariant(rx.status) as any} dot />
                    {rx.status === "dispensed" && !rx.refillRequested && (
                      <Button
                        size="xs"
                        variant="outline"
                        loading={refilling === rx._id}
                        onClick={() => handleRefill(rx._id)}
                        leftIcon={<RefreshCw className="h-3 w-3" />}
                      >
                        Request Refill
                      </Button>
                    )}
                    {rx.refillRequested && <Badge label="Refill requested" variant="primary" size="sm" />}
                  </div>
                </div>
                {/* Medications */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {rx.medications?.map((m, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                        <span className="text-xs text-slate-400">{m.dosage}</span>
                      </div>
                      <p className="text-xs text-slate-500">{m.frequency} · {m.duration}</p>
                      {m.instructions && <p className="mt-1 text-xs text-slate-400 italic">{m.instructions}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardSection>
        )}
      </Card>
    </div>
  );
}
