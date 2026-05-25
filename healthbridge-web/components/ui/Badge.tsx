import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "primary" | "default" | "violet" | "info";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  warning: "bg-amber-50  text-amber-700  ring-1 ring-amber-200/60",
  danger:  "bg-red-50    text-red-700    ring-1 ring-red-200/60",
  primary: "bg-brand-50  text-brand-700  ring-1 ring-brand-200/60",
  violet:  "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
  info:    "bg-sky-50     text-sky-700    ring-1 ring-sky-200/60",
  default: "bg-slate-100 text-slate-600  ring-1 ring-slate-200/60",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  primary: "bg-brand-500",
  violet:  "bg-violet-500",
  info:    "bg-sky-500",
  default: "bg-slate-400",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({ label, variant = "default", size = "md", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold capitalize",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
      )}
      {label}
    </span>
  );
}
