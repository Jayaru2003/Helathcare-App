import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentKafkaService } from '../services/appointment-kafka.service';
import { KAFKA_TOPICS } from '@healthbridge/kafka';

export class AppointmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = parseInt((req.query.limit as string) ?? '10', 10);
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const result = await AppointmentService.findAll({ page, limit, patientId, doctorId });
      res.json({ success: true, statusCode: 200, message: 'Appointments retrieved', ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.create(req.body);
      // Emit Kafka event
      await AppointmentKafkaService.produce(KAFKA_TOPICS.APPOINTMENT_CREATED, {
        value: {
          eventType: 'appointment.created',
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          scheduledAt: appointment.scheduledAt.toISOString(),
          type: appointment.type,
          timestamp: new Date().toISOString(),
        },
        key: appointment.id,
      });
      res.status(201).json({ success: true, statusCode: 201, message: 'Appointment created', data: appointment, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apt = await AppointmentService.findById(req.params.id);
      if (!apt) { res.status(404).json({ success: false, statusCode: 404, message: 'Appointment not found' }); return; }
      res.json({ success: true, statusCode: 200, message: 'Appointment retrieved', data: apt, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apt = await AppointmentService.update(req.params.id, req.body);
      res.json({ success: true, statusCode: 200, message: 'Appointment updated', data: apt, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const apt = await AppointmentService.cancel(req.params.id, req.user!.sub, reason);
      await AppointmentKafkaService.produce(KAFKA_TOPICS.APPOINTMENT_CANCELLED, {
        value: {
          eventType: 'appointment.cancelled',
          appointmentId: apt.id,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          cancellationReason: reason ?? 'No reason provided',
          timestamp: new Date().toISOString(),
        },
        key: apt.id,
      });
      res.json({ success: true, statusCode: 200, message: 'Appointment cancelled', data: apt, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apt = await AppointmentService.complete(req.params.id);
      res.json({ success: true, statusCode: 200, message: 'Appointment completed', data: apt, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId, date } = req.query as { doctorId: string; date: string };
      const slots = await AppointmentService.getAvailableSlots(doctorId, date);
      res.json({ success: true, statusCode: 200, message: 'Available slots retrieved', data: slots, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}
