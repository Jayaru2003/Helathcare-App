import { Request, Response, NextFunction } from 'express';
import { PrescriptionService } from '../services/prescription.service';

export class PrescriptionController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = parseInt((req.query.limit as string) ?? '10', 10);
      const result = await PrescriptionService.findAll({ page, limit });
      res.json({ success: true, statusCode: 200, message: 'Prescriptions retrieved', ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescription = await PrescriptionService.create(req.body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Prescription created', data: prescription, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await PrescriptionService.findById(req.params.id);
      if (!p) { res.status(404).json({ success: false, statusCode: 404, message: 'Prescription not found' }); return; }
      res.json({ success: true, statusCode: 200, message: 'Prescription retrieved', data: p, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prescriptions = await PrescriptionService.findByPatient(req.params.patientId);
      res.json({ success: true, statusCode: 200, message: 'Patient prescriptions retrieved', data: prescriptions, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await PrescriptionService.updateStatus(req.params.id, req.body.status);
      res.json({ success: true, statusCode: 200, message: 'Prescription status updated', data: p, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async requestRefill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const p = await PrescriptionService.requestRefill(req.params.id);
      res.json({ success: true, statusCode: 200, message: 'Refill requested', data: p, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}
