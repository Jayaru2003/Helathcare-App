import type { LucideIcon } from "lucide-react";
import { SearchX, FolderOpen, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  type?: "search" | "folder" | "calendar" | "custom";
}

const iconMap: Record<string, LucideIcon> = {
  search:   SearchX,
  folder:   FolderOpen,
  calendar: Calendar,
};

export function EmptyState({
  title   = "Nothing here yet",
  message = "Get started by adding your first item.",
  icon,
  action,
  className,
  type = "folder",
}: EmptyStateProps) {
  const Icon = icon ?? iconMap[type] ?? FolderOpen;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 rounded-2xl bg-slate-50 p-5">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="font-display text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
