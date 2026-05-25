"use client";
import { useEffect, useState } from "react";
import { useAuthStore }        from "@/store/auth.store";
import { patientService }      from "@/services/patient.service";
import { appointmentService }  from "@/services/appointment.service";
import { StatCard }            from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Users, Calendar, Clock, CheckCircle2, Video, Phone, Building2 } from "lucide-react";
import { formatDateTime, friendlyDate, statusVariant, initials } from "@/lib/utils";
import type { Appointment, Patient } from "@/types";
import Link from "next/link";

const typeIcon = { in_person: Building2, video: Video, phone: Phone };

export default function DoctorDashboard() {
  const { user }             = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [patientCount, setPCount] = useState(0);
  const [apptCount, setACount]    = useState(0);
  const [appointments, setAppts]  = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          patientService.getAll(1, 1),
          appointmentService.getAll(1, 8, user?.id ? { doctorId: user.id } : undefined),
        ]);
        setPCount(pRes.meta?.total ?? 0);
        setACount(aRes.meta?.total ?? 0);
        setAppts(aRes.data ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const pending   = appointments.filter(a => a.status === "scheduled").length;
  const completed = appointments.filter(a => a.status === "completed").length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Good morning, Dr. {user?.firstName ?? "Doctor"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s your overview for today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Patients"  value={patientCount} icon={Users}          iconBg="bg-brand-50"   iconColor="text-brand-600"   delay={0}   />
        <StatCard label="Appointments"    value={apptCount}    icon={Calendar}        iconBg="bg-violet-50"  iconColor="text-violet-600"  delay={75}  />
        <StatCard label="Pending"         value={pending}      icon={Clock}           iconBg="bg-amber-50"   iconColor="text-amber-600"   delay={150} />
        <StatCard label="Completed"       value={completed}    icon={CheckCircle2}    iconBg="bg-emerald-50" iconColor="text-emerald-600" delay={225} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Appointments */}
        <Card className="lg:col-span-2 animate-fade-up delay-150">
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <Link href="/doctor/appointments" className="text-xs font-semibold text-brand-600 hover:underline">
              View all →
            </Link>

          </CardHeader>
          {appointments.length === 0 ? (
            <EmptyState type="calendar" title="No appointments" message="Appointments booked for you will appear here." />
          ) : (
            <CardSection>
              {appointments.map((a) => {
                const TypeIcon = typeIcon[a.type] ?? Building2;
                return (
                  <div key={a.id} className="flex items-center gap-4 py-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <TypeIcon className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {a.reason}
                      </p>
                      <p className="text-xs text-slate-400">
                        {friendlyDate(a.scheduledAt)} · {formatDateTime(a.scheduledAt).split("·")[1]?.trim()}
                      </p>
                    </div>
                    <Badge label={a.status} variant={statusVariant(a.status) as any} dot />
                  </div>
                );
              })}
            </CardSection>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="animate-fade-up delay-225">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {[
              { href: "/doctor/patients",      label: "View all patients",         icon: Users,      color: "bg-brand-50 text-brand-600"   },
              { href: "/doctor/appointments",  label: "Manage appointments",       icon: Calendar,   color: "bg-violet-50 text-violet-600" },
              { href: "/doctor/prescriptions", label: "Write a prescription",      icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
