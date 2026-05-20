import { Request, Response } from 'express';

export class GatewayController {
  static getStatus(_req: Request, res: Response): void {
    res.json({
      success: true,
      service: 'api-gateway',
      version: process.env.npm_package_version ?? '1.0.0',
      services: {
        auth: process.env.AUTH_SERVICE_URL,
        patient: process.env.PATIENT_SERVICE_URL,
        appointment: process.env.APPOINTMENT_SERVICE_URL,
        prescription: process.env.PRESCRIPTION_SERVICE_URL,
        billing: process.env.BILLING_SERVICE_URL,
        notification: process.env.NOTIFICATION_SERVICE_URL,
        analytics: process.env.ANALYTICS_SERVICE_URL,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
