const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "";

/**
 * API base URL resolution:
 *
 * - In the BROWSER: always use "" (empty string = same-origin relative URLs).
 *   The browser sends requests to /api/* on the same HTTPS Amplify origin.
 *   Next.js rewrites (next.config.js) then proxy those /api/* calls server-side
 *   to the real HTTP ALB backend. Server→backend is HTTP (allowed); the browser
 *   only ever talks HTTPS to Amplify, so Mixed Content is never triggered.
 *
 * - On the SERVER (SSR): use the real backend URL directly, since Node.js
 *   has no Mixed Content restrictions.
 *
 * For local dev, set NEXT_PUBLIC_API_URL=http://localhost:3000 in .env.local.
 */
export const API_BASE_URL =
  typeof window !== "undefined"
    ? ""                                          // browser → same-origin proxy
    : (normalizedApiUrl || "http://localhost:3000"); // server  → direct ALB

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
