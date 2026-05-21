import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createPatientSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  phoneNumber: z.string().min(5).max(20),
  email: z.string().email(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ userId: true });

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;

export class PatientService {
  static async findAll({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.patient.findMany({ where: { isActive: true }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.patient.count({ where: { isActive: true } }),
    ]);
    return {
      data,
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  static async findById(id: string) {
    return prisma.patient.findUnique({ where: { id, isActive: true }, include: { medicalRecords: true } });
  }

  static async create(dto: CreatePatientDto) {
    return prisma.patient.create({
      data: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        allergies: [],
        currentMedications: [],
        medicalHistory: [],
      },
    });
  }

  static async update(id: string, dto: UpdatePatientDto) {
    return prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
      },
    });
  }

  static async remove(id: string) {
    return prisma.patient.update({ where: { id }, data: { isActive: false } });
  }

  static async getMedicalRecords(patientId: string) {
    return prisma.medicalRecord.findMany({ where: { patientId }, orderBy: { recordedAt: 'desc' } });
  }

  static async addMedicalRecord(patientId: string, data: Record<string, unknown>) {
    return prisma.medicalRecord.create({
      data: {
        patientId,
        recordType: data.recordType as string,
        title: data.title as string,
        description: data.description as string | undefined,
        fileUrl: data.fileUrl as string | undefined,
        recordedBy: data.recordedBy as string,
        recordedAt: new Date(data.recordedAt as string),
        tags: (data.tags as string[]) ?? [],
      },
    });
  }
}

