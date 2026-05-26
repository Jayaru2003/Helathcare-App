const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "";

/**
 * In production (Amplify), prefer explicit NEXT_PUBLIC_API_URL.
 * If not set, keep requests relative so Next rewrites can still proxy `/api/*`.
 */
// Important for AWS Amplify:
// If we call the API gateway with an absolute URL from the browser, you can hit CORS issues.
// We avoid that by using same-origin relative requests in production and letting Next rewrites
// forward `/api/*` to the API gateway.
export const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "" : (normalizedApiUrl || "http://localhost:3000");

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
