import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const router = Router();

// ─── Proxy Factory ─────────────────────────────────────────────────────────
function makeProxy(target: string, pathRewrite?: Record<string, string>) {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err: Error, _req, res) => {
        console.error(`[Proxy] Error proxying to ${target}:`, err.message);
        (res as Response).status(502).json({
          success: false,
          statusCode: 502,
          message: `Upstream service unavailable: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      },
    },
  };
  return createProxyMiddleware(options);
}

// ─── Service Routes ────────────────────────────────────────────────────────
const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const PATIENT_URL = process.env.PATIENT_SERVICE_URL ?? 'http://localhost:3002';
const APPOINTMENT_URL = process.env.APPOINTMENT_SERVICE_URL ?? 'http://localhost:3003';
const PRESCRIPTION_URL = process.env.PRESCRIPTION_SERVICE_URL ?? 'http://localhost:3004';
const BILLING_URL = process.env.BILLING_SERVICE_URL ?? 'http://localhost:3005';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3006';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3007';

router.use('/v1/auth', makeProxy(AUTH_URL, { '^/api/v1/auth': '/api/v1/auth' }));
router.use('/v1/patients', makeProxy(PATIENT_URL, { '^/api/v1/patients': '/api/v1/patients' }));
router.use('/v1/appointments', makeProxy(APPOINTMENT_URL, { '^/api/v1/appointments': '/api/v1/appointments' }));
router.use('/v1/prescriptions', makeProxy(PRESCRIPTION_URL, { '^/api/v1/prescriptions': '/api/v1/prescriptions' }));
router.use('/v1/billing', makeProxy(BILLING_URL, { '^/api/v1/billing': '/api/v1/billing' }));
router.use('/v1/notifications', makeProxy(NOTIFICATION_URL, { '^/api/v1/notifications': '/api/v1/notifications' }));
router.use('/v1/analytics', makeProxy(ANALYTICS_URL, { '^/api/v1/analytics': '/api/v1/analytics' }));

export default router;
