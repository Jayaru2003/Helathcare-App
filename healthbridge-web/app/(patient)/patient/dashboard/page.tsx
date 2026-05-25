"use client";
import { useEffect, useState } from "react";
import { useAuthStore }        from "@/store/auth.store";
import { appointmentService }  from "@/services/appointment.service";
import { StatCard }            from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Calendar, CheckCircle2, Clock, ArrowRight, Video, Phone, Building2 } from "lucide-react";
import { friendlyDate, statusVariant } from "@/lib/utils";
import type { Appointment }    from "@/types";
import Link from "next/link";

const typeIcon: Record<string, React.ElementType> = { in_person: Building2, video: Video, phone: Phone };
const typeLabel: Record<string, string> = { in_person: "In Person", video: "Video Call", phone: "Phone" };

export default function PatientDashboard() {
  const { user }            = useAuthStore();
  const [appts, setAppts]   = useState<Appointment[]>([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    appointmentService.getAll(1, 20, user?.id ? { patientId: user.id } : undefined)
      .then(r => setAppts(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [user?.id]);

  const upcoming  = appts.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const completed = appts.filter(a => a.status === "completed");

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="animate-fade-up rounded-2xl bg-gradient-to-r from-brand-500 to-blue-600 p-6 text-white shadow-lg shadow-brand-200">
        <p className="text-sm font-medium text-white/70">Welcome back</p>
        <h1 className="font-display mt-1 text-2xl font-bold">
          Hello, {user?.firstName ?? "Patient"} 👋
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {upcoming.length > 0
            ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? "s" : ""}.`
            : "No upcoming appointments. Book one today!"}
        </p>
        <Link href="/patient/appointments">
          <Button variant="outline" size="sm" className="mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            View Appointments
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total"     value={appts.length}    icon={Calendar}     iconBg="bg-brand-50"   iconColor="text-brand-600"   delay={0}   />
        <StatCard label="Upcoming"  value={upcoming.length} icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-600"   delay={75}  />
        <StatCard label="Completed" value={completed.length}icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" delay={150} />
      </div>

      {/* Upcoming Appointments */}
      <Card className="animate-fade-up delay-150">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <Link href="/patient/appointments" className="text-xs font-semibold text-brand-600 hover:underline">View all →</Link>
        </CardHeader>
        {upcoming.length === 0 ? (
          <EmptyState type="calendar" title="No upcoming appointments" message="Book an appointment with your doctor." action={<Link href="/patient/appointments"><Button size="sm">Book Now</Button></Link>} />

        ) : (
          <CardSection>
            {upcoming.slice(0, 5).map(a => {
              const TypeIcon = typeIcon[a.type] ?? Building2;
              return (
                <div key={a.id} className="flex items-center gap-4 py-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <TypeIcon className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.reason}</p>
                    <p className="text-xs text-slate-400">
                      {friendlyDate(a.scheduledAt)} · {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {typeLabel[a.type] ?? a.type}
                    </p>
                  </div>
                  <Badge label={a.status} variant={statusVariant(a.status) as any} dot />
                </div>
              );
            })}
          </CardSection>
        )}
      </Card>
    </div>
  );
}
