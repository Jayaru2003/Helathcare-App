import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  iconBg?: string;
  iconColor?: string;
  delay?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconBg  = "bg-brand-50",
  iconColor = "text-brand-600",
  delay = 0,
  className,
}: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <div
      className={cn(
        "hb-card p-5 animate-fade-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="font-display text-3xl font-bold text-slate-900 leading-none">
            {value}
          </p>
        </div>
        <div className={cn("rounded-2xl p-3", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-semibold",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}>
            {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
