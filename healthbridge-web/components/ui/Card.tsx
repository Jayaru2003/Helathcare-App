import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddings = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

export function Card({ className, children, padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "hb-card",
        paddings[padding],
        hover && "transition-shadow duration-200 hover:shadow-md cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("font-display text-base font-semibold text-slate-900", className)}>
      {children}
    </h2>
  );
}

export function CardSection({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("divide-y divide-slate-50", className)}>
      {children}
    </div>
  );
}
