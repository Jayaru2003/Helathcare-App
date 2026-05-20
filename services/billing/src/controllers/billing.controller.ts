import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';
import Stripe from 'stripe';

export class BillingController {
  static async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = parseInt((req.query.limit as string) ?? '10', 10);
      const patientId = req.query.patientId as string | undefined;
      const result = await BillingService.findAll({ page, limit, patientId });
      res.json({ success: true, statusCode: 200, message: 'Invoices retrieved', ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await BillingService.createInvoice(req.body);
      res.status(201).json({ success: true, statusCode: 201, message: 'Invoice created', data: invoice, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await BillingService.findById(req.params.id);
      if (!invoice) { res.status(404).json({ success: false, statusCode: 404, message: 'Invoice not found' }); return; }
      res.json({ success: true, statusCode: 200, message: 'Invoice retrieved', data: invoice, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BillingService.createPaymentIntent(req.params.id);
      res.json({ success: true, statusCode: 200, message: 'Payment intent created', data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async updateInvoiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await BillingService.updateStatus(req.params.id, req.body.status);
      res.json({ success: true, statusCode: 200, message: 'Invoice status updated', data: invoice, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  static async stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      await BillingService.handleStripeWebhook(req.body as Buffer, sig);
      res.json({ received: true });
    } catch (err) { next(err); }
  }
}
