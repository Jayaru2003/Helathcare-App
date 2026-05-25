// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  phoneNumber: string;
  email: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: string;
  title: string;
  description?: string;
  fileUrl?: string;
  recordedBy: string;
  recordedAt: string;
  tags?: string[];
}

// ─── Appointment ──────────────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: "in_person" | "video" | "phone";
  reason: string;
  notes?: string;
  symptoms?: string[];
  status: string;
  fee?: number;
  currency?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt?: string;
}

// ─── Prescription ─────────────────────────────────────────────────────────────
export interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  status: string;
  issuedAt: string;
  validUntil?: string;
  refillRequested?: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

// ─── API Response wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timestamp: string;
}

// ─── Health check ─────────────────────────────────────────────────────────────
export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unreachable";
  latencyMs: number;
  error?: string;
}

export interface HealthResponse {
  success: boolean;
  service: string;
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
}
