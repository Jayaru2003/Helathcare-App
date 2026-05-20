import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(240).default(30),
  type: z.enum(['in_person', 'video', 'phone']).default('in_person'),
  reason: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
  symptoms: z.array(z.string()).default([]),
  fee: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;

export class AppointmentService {
  static async findAll({ page, limit, patientId, doctorId }: { page: number; limit: number; patientId?: string; doctorId?: string }) {
    const skip = (page - 1) * limit;
    const where = { ...(patientId ? { patientId } : {}), ...(doctorId ? { doctorId } : {}) };
    const [data, total] = await Promise.all([
      prisma.appointment.findMany({ where, skip, take: limit, orderBy: { scheduledAt: 'desc' } }),
      prisma.appointment.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  static async findById(id: string) {
    return prisma.appointment.findUnique({ where: { id } });
  }

  static async create(dto: CreateAppointmentDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + dto.durationMinutes * 60_000);

    // Conflict detection
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: { notIn: ['cancelled', 'completed'] },
        scheduledAt: { lt: endTime },
        // Approximate: check overlaps in the time window
      },
    });
    if (conflict) {
      const conflictEnd = new Date(conflict.scheduledAt.getTime() + conflict.durationMinutes * 60_000);
      if (conflictEnd > scheduledAt) {
        throw Object.assign(new Error('Doctor has a conflicting appointment at this time'), { statusCode: 409 });
      }
    }

    return prisma.appointment.create({
      data: {
        ...dto,
        scheduledAt,
        fee: dto.fee,
      },
    });
  }

  static async update(id: string, dto: UpdateAppointmentDto) {
    return prisma.appointment.update({
      where: { id },
      data: { ...dto, ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}) },
    });
  }

  static async cancel(id: string, cancelledBy: string, reason?: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled', cancellationReason: reason, cancelledBy, cancelledAt: new Date() },
    });
  }

  static async complete(id: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
    });
  }

  static async getAvailableSlots(doctorId: string, date: string): Promise<Array<{ startTime: string; endTime: string; isAvailable: boolean }>> {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0);

    const existing = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['cancelled'] },
      },
    });

    const slots: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = [];
    let current = dayStart.getTime();

    while (current < dayEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current + 30 * 60_000);
      const isTaken = existing.some((apt) => {
        const aptEnd = new Date(apt.scheduledAt.getTime() + apt.durationMinutes * 60_000);
        return apt.scheduledAt < slotEnd && aptEnd > slotStart;
      });
      slots.push({ startTime: slotStart.toISOString(), endTime: slotEnd.toISOString(), isAvailable: !isTaken });
      current += 30 * 60_000;
    }
    return slots;
  }
}
