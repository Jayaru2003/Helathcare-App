const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "";

/**
 * Always use same-origin relative requests in the browser.
 * Otherwise Amplify will send the request cross-origin and CORS will block it.
 *
 * Next rewrites (next.config.js) will forward `/api/*` to the real backend.
 */
export const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : (normalizedApiUrl || "http://localhost:3000");

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
