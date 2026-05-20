import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';

export class PatientController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = parseInt(req.query.limit as string ?? '10', 10);
      const result = await PatientService.findAll({ page, limit });
      res.json({ success: true, statusCode: 200, message: 'Patients retrieved', ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.create(req.body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Patient created', data: patient, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.findById(req.params.id);
      if (!patient) { res.status(404).json({ success: false, statusCode: 404, message: 'Patient not found' }); return; }
      res.json({ success: true, statusCode: 200, message: 'Patient retrieved', data: patient, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.update(req.params.id, req.body);
      res.json({ success: true, statusCode: 200, message: 'Patient updated', data: patient, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PatientService.remove(req.params.id);
      res.json({ success: true, statusCode: 200, message: 'Patient deleted', timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getMedicalRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await PatientService.getMedicalRecords(req.params.id);
      res.json({ success: true, statusCode: 200, message: 'Medical records retrieved', data: records, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async addMedicalRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await PatientService.addMedicalRecord(req.params.id, req.body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Medical record added', data: record, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}
