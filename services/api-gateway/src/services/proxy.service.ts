export interface ServiceConfig {
  name: string;
  url: string;
  pathPrefix: string;
}

export class ProxyService {
  static getServiceConfigs(): ServiceConfig[] {
    return [
      { name: 'auth', url: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001', pathPrefix: '/v1/auth' },
      { name: 'patient', url: process.env.PATIENT_SERVICE_URL ?? 'http://localhost:3002', pathPrefix: '/v1/patients' },
      { name: 'appointment', url: process.env.APPOINTMENT_SERVICE_URL ?? 'http://localhost:3003', pathPrefix: '/v1/appointments' },
      { name: 'prescription', url: process.env.PRESCRIPTION_SERVICE_URL ?? 'http://localhost:3004', pathPrefix: '/v1/prescriptions' },
      { name: 'billing', url: process.env.BILLING_SERVICE_URL ?? 'http://localhost:3005', pathPrefix: '/v1/billing' },
      { name: 'notification', url: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3006', pathPrefix: '/v1/notifications' },
      { name: 'analytics', url: process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3007', pathPrefix: '/v1/analytics' },
    ];
  }

  static async checkHealth(serviceUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${serviceUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }
}
