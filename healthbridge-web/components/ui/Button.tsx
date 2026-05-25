import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success" | "secondary";
type Size    = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm hover:shadow-brand-sm",
  secondary: "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700",
  outline:   "border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 bg-white",
  ghost:     "hover:bg-slate-100 active:bg-slate-200 text-slate-600",
  danger:    "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm",
  success:   "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm",
};

const sizes: Record<Size, string> = {
  xs: "h-7  px-2.5 text-xs  gap-1.5 rounded-lg",
  sm: "h-8  px-3   text-sm  gap-1.5 rounded-xl",
  md: "h-10 px-4   text-sm  gap-2   rounded-xl",
  lg: "h-11 px-5   text-base gap-2  rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1",
        "disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
