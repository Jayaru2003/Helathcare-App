const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "";

/**
 * API base URL resolution:
 *
 * - In the browser: use the real backend URL directly (from NEXT_PUBLIC_API_URL).
 *   The same-origin proxy approach (empty string + Next.js rewrites) only works
 *   when NEXT_PUBLIC_API_URL is set in the build environment so that next.config.js
 *   can configure the rewrite destination. When the env var is missing the rewrite
 *   array is empty and every /api/* request 404s / times out.
 *   Using the URL directly avoids that dependency and works regardless of whether
 *   the rewrite is configured.
 *
 * - On the server (SSR / API routes): also use the real backend URL.
 *
 * For local development set NEXT_PUBLIC_API_URL=http://localhost:3000 in .env.local.
 */
export const API_BASE_URL = normalizedApiUrl || "http://localhost:3000";

export const ROLES = {
  PATIENT: "patient",
  DOCTOR:  "doctor",
  ADMIN:   "admin",
  STAFF:   "staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  doctor:  "Doctor",
  admin:   "Admin",
  staff:   "Staff",
};

export const APPOINTMENT_TYPES = [
  { value: "in_person", label: "In Person" },
  { value: "video",     label: "Video Call" },
  { value: "phone",     label: "Phone Call" },
] as const;

export const APPOINTMENT_STATUSES = [
  { value: "scheduled",  label: "Scheduled",  color: "warning" },
  { value: "confirmed",  label: "Confirmed",  color: "primary" },
  { value: "completed",  label: "Completed",  color: "success" },
  { value: "cancelled",  label: "Cancelled",  color: "danger"  },
  { value: "no_show",    label: "No Show",    color: "default" },
] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GENDERS = [
  { value: "male",             label: "Male"           },
  { value: "female",           label: "Female"         },
  { value: "other",            label: "Other"          },
  { value: "prefer_not_to_say",label: "Prefer not to say" },
] as const;
