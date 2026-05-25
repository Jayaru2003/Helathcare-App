"use client";
import { useEffect, useState } from "react";
import { useAuthStore }        from "@/store/auth.store";
import { patientService }      from "@/services/patient.service";
import { appointmentService }  from "@/services/appointment.service";
import { StatCard }            from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { EmptyState }          from "@/components/ui/EmptyState";
import { PageLoader }          from "@/components/ui/Spinner";
import { Users, Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { friendlyDate, statusVariant } from "@/lib/utils";
import type { Appointment }    from "@/types";
import Link from "next/link";

export default function StaffDashboard() {
  const { user }             = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [patientCount, setPCount] = useState(0);
  const [appts, setAppts]         = useState<Appointment[]>([]);
  const [apptTotal, setATotal]    = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          patientService.getAll(1, 1),
          appointmentService.getAll(1, 10),
        ]);
        setPCount(pRes.meta?.total ?? 0);
        setAppts(aRes.data ?? []);
        setATotal(aRes.meta?.total ?? 0);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const todayAppts = appts.filter(a => {
    const d = new Date(a.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Reception Dashboard 📋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Hello, {user?.firstName ?? "Staff"} — {todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} today
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Patients"   value={patientCount}           icon={Users}          iconBg="bg-teal-50"    iconColor="text-teal-600"    delay={0}   />
        <StatCard label="All Appointments" value={apptTotal}              icon={Calendar}       iconBg="bg-brand-50"   iconColor="text-brand-600"   delay={75}  />
        <StatCard label="Today"            value={todayAppts.length}      icon={Clock}          iconBg="bg-amber-50"   iconColor="text-amber-600"   delay={150} />
        <StatCard label="Pending"          value={appts.filter(a => a.status === "scheduled").length} icon={CheckCircle2} iconBg="bg-violet-50" iconColor="text-violet-600" delay={225} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up delay-150">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <Link href="/staff/appointments" className="text-xs font-semibold text-brand-600 hover:underline">Manage →</Link>
          </CardHeader>
          {todayAppts.length === 0 ? (
            <EmptyState type="calendar" title="No appointments today" message="All clear for today." />
          ) : (
            <CardSection>
              {todayAppts.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-slate-400">{a.durationMinutes}m</p>
                  </div>
                  <div className="h-8 w-px bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.reason}</p>
                    <p className="text-xs capitalize text-slate-400">{a.type?.replace("_", " ")}</p>
                  </div>
                  <Badge label={a.status} variant={statusVariant(a.status) as any} dot />
                </div>
              ))}
            </CardSection>
          )}
        </Card>

        <Card className="animate-fade-up delay-225">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {[
              { href: "/staff/patients",     label: "Search & register patients", icon: Users,     bg: "bg-teal-50 text-teal-600"  },
              { href: "/staff/appointments", label: "Manage all appointments",    icon: Calendar,  bg: "bg-brand-50 text-brand-600" },
            ].map(({ href, label, icon: Icon, bg }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-brand-200 hover:bg-brand-50 group"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
