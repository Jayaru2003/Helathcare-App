import mongoose, { Schema, Document, Model } from 'mongoose';
import { z } from 'zod';

// ─── Mongoose Schema ─────────────────────────────────────────────────────────

const MedicationItemSchema = new Schema({
  name: { type: String, required: true },
  genericName: String,
  dosage: {
    amount: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  frequency: { type: String, required: true },
  route: { type: String, required: true },
  durationDays: { type: Number, required: true },
  refillsAllowed: { type: Number, default: 0 },
  refillsRemaining: { type: Number, default: 0 },
  instructions: String,
  sideEffects: [String],
  interactions: [String],
}, { _id: false });

const PrescriptionSchema = new Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    appointmentId: String,
    medications: { type: [MedicationItemSchema], required: true },
    diagnosis: { type: String, required: true },
    icdCode: String,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    notes: String,
    digitalSignature: String,
    pharmacyId: String,
    dispensedAt: Date,
    version: { type: Number, default: 1 },
    // Event sourcing: store history of changes
    eventHistory: [
      {
        eventType: String,
        data: Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        actorId: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'prescriptions',
  }
);

export interface IPrescription extends Document {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Array<Record<string, unknown>>;
  diagnosis: string;
  icdCode?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  issuedAt: Date;
  expiresAt: Date;
  notes?: string;
  digitalSignature?: string;
  version: number;
}

const PrescriptionModel: Model<IPrescription> = mongoose.models.Prescription
  ?? mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

// ─── Zod Validation ─────────────────────────────────────────────────────────

const MedicationItemZod = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  dosage: z.object({ amount: z.number().positive(), unit: z.string() }),
  frequency: z.string().min(1),
  route: z.enum(['oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal']),
  durationDays: z.number().int().positive(),
  refillsAllowed: z.number().int().min(0).default(0),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  medications: z.array(MedicationItemZod).min(1),
  diagnosis: z.string().min(1).max(500),
  icdCode: z.string().optional(),
  expiresAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export type CreatePrescriptionDto = z.infer<typeof createPrescriptionSchema>;

// ─── Service ────────────────────────────────────────────────────────────────

export class PrescriptionService {
  static async findAll({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PrescriptionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PrescriptionModel.countDocuments(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  static async findById(id: string) {
    return PrescriptionModel.findById(id).lean();
  }

  static async findByPatient(patientId: string) {
    return PrescriptionModel.find({ patientId }).sort({ createdAt: -1 }).lean();
  }

  static async create(dto: CreatePrescriptionDto) {
    const medications = dto.medications.map((m) => ({
      ...m,
      refillsRemaining: m.refillsAllowed,
    }));

    const prescription = new PrescriptionModel({
      ...dto,
      medications,
      expiresAt: new Date(dto.expiresAt),
      eventHistory: [{ eventType: 'prescription.created', data: dto, actorId: dto.doctorId }],
    });

    return prescription.save();
  }

  static async updateStatus(id: string, status: string) {
    return PrescriptionModel.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $inc: { version: 1 },
        $push: { eventHistory: { eventType: `status.changed.${status}`, data: { status }, timestamp: new Date() } },
      },
      { new: true }
    );
  }

  static async requestRefill(id: string) {
    const prescription = await PrescriptionModel.findById(id);
    if (!prescription) throw Object.assign(new Error('Prescription not found'), { statusCode: 404 });

    const canRefill = prescription.medications.some((m: any) => m.refillsRemaining > 0);
    if (!canRefill) throw Object.assign(new Error('No refills remaining'), { statusCode: 400 });

    return PrescriptionModel.findByIdAndUpdate(
      id,
      {
        $inc: { version: 1 },
        $push: { eventHistory: { eventType: 'refill.requested', data: {}, timestamp: new Date() } },
      },
      { new: true }
    );
  }
}
