"use client";
import { useEffect, useState } from "react";
import { systemService }       from "@/services/system.service";
import { patientService }      from "@/services/patient.service";
import { appointmentService }  from "@/services/appointment.service";
import { StatCard }            from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardSection } from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { Button }              from "@/components/ui/Button";
import { PageLoader }          from "@/components/ui/Spinner";
import { useAuthStore }        from "@/store/auth.store";
import { Users, Calendar, Activity, Shield, RefreshCw, CheckCircle2, AlertTriangle, WifiOff } from "lucide-react";
import type { ServiceHealth }  from "@/types";

const statusIcon = {
  healthy:     { icon: CheckCircle2,    color: "text-emerald-500" },
  degraded:    { icon: AlertTriangle,   color: "text-amber-500"   },
  unreachable: { icon: WifiOff,         color: "text-red-500"     },
};

function ServiceRow({ svc }: { svc: ServiceHealth }) {
  const cfg  = statusIcon[svc.status] ?? statusIcon.unreachable;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-4 py-3">
      <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold capitalize text-slate-800">{svc.name}</p>
        {svc.error && <p className="text-xs text-slate-400">{svc.error}</p>}
      </div>
      <span className="text-xs text-slate-400">{svc.latencyMs}ms</span>
      <Badge
        label={svc.status}
        variant={svc.status === "healthy" ? "success" : svc.status === "degraded" ? "warning" : "danger"}
        dot
      />
    </div>
  );
}

export default function AdminDashboard() {
  const { user }                = useAuthStore();
  const [loading, setLoading]   = useState(true);
  const [healthLoading, setHL]  = useState(false);
  const [health, setHealth]     = useState<ServiceHealth[]>([]);
  const [allHealthy, setAllH]   = useState(false);
  const [pCount, setPCount]     = useState(0);
  const [aCount, setACount]     = useState(0);

  const fetchHealth = async () => {
    setHL(true);
    try {
      const h = await systemService.getHealth();
      setHealth(h.services ?? []);
      setAllH(h.success);
    } catch {}
    setHL(false);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchHealth(),
        patientService.getAll(1, 1).then(r => setPCount(r.meta?.total ?? 0)).catch(() => {}),
        appointmentService.getAll(1, 1).then(r => setACount(r.meta?.total ?? 0)).catch(() => {}),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">System overview and health status</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Patients"    value={pCount}  icon={Users}          iconBg="bg-brand-50"   iconColor="text-brand-600"   delay={0}   />
        <StatCard label="Total Appointments" value={aCount} icon={Calendar}       iconBg="bg-violet-50"  iconColor="text-violet-600"  delay={75}  />
        <StatCard label="Services"          value={health.length} icon={Activity} iconBg="bg-slate-50"   iconColor="text-slate-600"   delay={150} />
        <StatCard
          label="System Status"
          value={allHealthy ? "Healthy" : "Issues"}
          icon={Shield}
          iconBg={allHealthy ? "bg-emerald-50" : "bg-red-50"}
          iconColor={allHealthy ? "text-emerald-600" : "text-red-600"}
          delay={225}
        />
      </div>

      {/* System Health */}
      <Card className="animate-fade-up delay-150">
        <CardHeader>
          <CardTitle>Microservice Health</CardTitle>
          <Button
            id="refresh-health-btn"
            size="sm"
            variant="outline"
            loading={healthLoading}
            onClick={fetchHealth}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </CardHeader>
        {health.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Could not reach API gateway.</p>
        ) : (
          <CardSection>
            {health.map(svc => <ServiceRow key={svc.name} svc={svc} />)}
          </CardSection>
        )}
      </Card>
    </div>
  );
}
