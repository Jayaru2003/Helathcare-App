import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the role-specific dashboard path */
export function roleDashboard(role: string): string {
  const map: Record<string, string> = {
    doctor:  "/doctor/dashboard",
    patient: "/patient/dashboard",
    admin:   "/admin/dashboard",
    staff:   "/staff/dashboard",
  };
  return map[role] ?? "/login";
}


/** Formats a date for display */
export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

/** Formats a datetime for display */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy · h:mm a");
}

/** Returns "Today", "Tomorrow", or a formatted date */
export function friendlyDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d, yyyy");
}

/** Returns relative time like "2 hours ago" */
export function relativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Returns status badge variant */
export function statusVariant(status?: string): string {
  const map: Record<string, string> = {
    completed:  "success",
    confirmed:  "primary",
    cancelled:  "danger",
    no_show:    "default",
    scheduled:  "warning",
    active:     "success",
    inactive:   "default",
    pending:    "warning",
    dispensed:  "success",
    expired:    "danger",
    refill_requested: "primary",
  };
  return map[status ?? ""] ?? "default";
}

/** Returns initials from a full name */
export function initials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

/** Decode a JWT payload without verifying signature (client-side only) */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Formats currency */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
