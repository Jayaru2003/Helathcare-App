"use client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  center?: boolean;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className, center = false }: SpinnerProps) {
  const spinner = (
    <Loader2 className={cn("animate-spin text-brand-500", sizes[size], className)} />
  );
  if (center) {
    return (
      <div className="flex h-40 items-center justify-center">
        {spinner}
      </div>
    );
  }
  return spinner;
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
