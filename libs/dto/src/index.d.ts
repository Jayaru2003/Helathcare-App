export type UUID = string;
export type ISODateString = string;
export type UserRole = 'patient' | 'doctor' | 'admin' | 'staff';
export interface User {
    id: UUID;
    email: string;
    passwordHash?: string;
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
    expiresIn: number;
    tokenType: 'Bearer';
}
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
    recordedBy: UUID;
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
    userId: UUID;
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
export interface WorkingHours {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startTime: string;
    endTime: string;
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
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
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
    videoCallUrl?: string;
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
export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export interface MedicationDosage {
    amount: number;
    unit: 'mg' | 'ml' | 'mcg' | 'g' | 'IU' | 'drops' | 'puffs';
}
export interface MedicationItem {
    name: string;
    genericName?: string;
    dosage: MedicationDosage;
    frequency: string;
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
    icdCode?: string;
    status: PrescriptionStatus;
    issuedAt: ISODateString;
    expiresAt: ISODateString;
    notes?: string;
    digitalSignature?: string;
    pharmacyId?: UUID;
    dispensedAt?: ISODateString;
    version: number;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
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
    stack?: string;
}
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
export type HealthBridgeEvent = AppointmentCreatedEvent | AppointmentCancelledEvent | PrescriptionCreatedEvent | InvoiceCreatedEvent | PaymentCompletedEvent;
//# sourceMappingURL=index.d.ts.map