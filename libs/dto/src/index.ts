// ─── Base Types ───────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string; // e.g., "2024-01-15T10:30:00.000Z"

// ─── User / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin' | 'staff';

export interface User {
  id: UUID;
  email: string;
  passwordHash?: string;         // Excluded from API responses
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastLoginAt?: ISODateString;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;             // Seconds until access token expires
  tokenType: 'Bearer';
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface MedicalRecord {
  id: UUID;
  patientId: UUID;
  recordType: 'lab_result' | 'imaging' | 'clinical_note' | 'discharge_summary' | 'referral';
  title: string;
  description?: string;
  fileUrl?: string;
  recordedBy: UUID;             // Doctor/Staff user ID
  recordedAt: ISODateString;
  tags: string[];
  createdAt: ISODateString;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
}

export interface Patient {
  id: UUID;
  userId: UUID;                  // References User.id
  firstName: string;
  lastName: string;
  dateOfBirth: ISODateString;
  gender: Gender;
  bloodType?: BloodType;
  nationalId?: string;
  phoneNumber: string;
  email: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  allergies: Allergy[];
  currentMedications: string[];
  medicalHistory: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

export interface WorkingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string;  // "HH:mm" e.g. "09:00"
  endTime: string;    // "HH:mm" e.g. "17:00"
}

export interface Doctor {
  id: UUID;
  userId: UUID;
  firstName: string;
  lastName: string;
  specialty: string;
  subSpecialties: string[];
  licenseNumber: string;
  qualifications: string[];
  hospitalAffiliations: string[];
  yearsOfExperience: number;
  bio?: string;
  profileImageUrl?: string;
  phoneNumber: string;
  email: string;
  consultationFee: number;
  currency: string;
  workingHours: WorkingHours[];
  rating?: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType = 'in_person' | 'video' | 'phone';

export interface Appointment {
  id: UUID;
  patientId: UUID;
  doctorId: UUID;
  scheduledAt: ISODateString;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  symptoms?: string[];
  videoCallUrl?: string;         // For telemedicine appointments
  cancellationReason?: string;
  cancelledBy?: UUID;
  cancelledAt?: ISODateString;
  completedAt?: ISODateString;
  followUpRequired: boolean;
  followUpDate?: ISODateString;
  fee: number;
  currency: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AppointmentSlot {
  doctorId: UUID;
  startTime: ISODateString;
  endTime: ISODateString;
  isAvailable: boolean;
}

// ─── Prescription ────────────────────────────────────────────────────────────

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface MedicationDosage {
  amount: number;
  unit: 'mg' | 'ml' | 'mcg' | 'g' | 'IU' | 'drops' | 'puffs';
}

export interface MedicationItem {
  name: string;
  genericName?: string;
  dosage: MedicationDosage;
  frequency: string;             // e.g., "twice daily", "every 8 hours"
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'sublingual' | 'rectal';
  durationDays: number;
  refillsAllowed: number;
  refillsRemaining: number;
  instructions?: string;
  sideEffects?: string[];
  interactions?: string[];
}

export interface Prescription {
  id: UUID;
  patientId: UUID;
  doctorId: UUID;
  appointmentId?: UUID;
  medications: MedicationItem[];
  diagnosis: string;
  icdCode?: string;              // ICD-10 diagnosis code
  status: PrescriptionStatus;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
  notes?: string;
  digitalSignature?: string;    // Doctor's digital signature hash
  pharmacyId?: UUID;
  dispensedAt?: ISODateString;
  version: number;              // For event sourcing
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;             // Percentage discount (0-100)
  tax?: number;                  // Percentage tax
  total: number;
}

export interface Invoice {
  id: UUID;
  invoiceNumber: string;
  patientId: UUID;
  appointmentId?: UUID;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: ISODateString;
  paidAt?: ISODateString;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface Notification {
  id: UUID;
  recipientId: UUID;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  status: NotificationStatus;
  sentAt?: ISODateString;
  deliveredAt?: ISODateString;
  readAt?: ISODateString;
  failureReason?: string;
  retryCount: number;
  createdAt: ISODateString;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  timestamp: ISODateString;
  requestId?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  timestamp: ISODateString;
  requestId?: string;
  stack?: string;               // Only included in development
}

// ─── Kafka Event Payloads ─────────────────────────────────────────────────────

export interface AppointmentCreatedEvent {
  eventType: 'appointment.created';
  appointmentId: UUID;
  patientId: UUID;
  doctorId: UUID;
  scheduledAt: ISODateString;
  type: AppointmentType;
  timestamp: ISODateString;
}

export interface AppointmentCancelledEvent {
  eventType: 'appointment.cancelled';
  appointmentId: UUID;
  patientId: UUID;
  doctorId: UUID;
  cancellationReason: string;
  timestamp: ISODateString;
}

export interface PrescriptionCreatedEvent {
  eventType: 'prescription.created';
  prescriptionId: UUID;
  patientId: UUID;
  doctorId: UUID;
  medicationNames: string[];
  timestamp: ISODateString;
}

export interface InvoiceCreatedEvent {
  eventType: 'billing.invoice.created';
  invoiceId: UUID;
  invoiceNumber: string;
  patientId: UUID;
  total: number;
  currency: string;
  dueDate: ISODateString;
  timestamp: ISODateString;
}

export interface PaymentCompletedEvent {
  eventType: 'billing.payment.completed';
  invoiceId: UUID;
  patientId: UUID;
  amount: number;
  currency: string;
  paymentMethod: string;
  timestamp: ISODateString;
}

export type HealthBridgeEvent =
  | AppointmentCreatedEvent
  | AppointmentCancelledEvent
  | PrescriptionCreatedEvent
  | InvoiceCreatedEvent
  | PaymentCompletedEvent;
