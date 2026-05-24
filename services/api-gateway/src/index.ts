/**
 * HealthBridge API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Single entry point for all downstream microservices.
 * Env vars are injected by ECS task definitions — no dotenv import.
 *
 * Route map (public path → downstream service → internal path):
 *   /api/auth/*          → AUTH_SERVICE_URL          (port 3001)  → /api/v1/auth/*
 *   /api/patients/*      → PATIENT_SERVICE_URL        (port 3002)  → /api/v1/patients/*
 *   /api/appointments/*  → APPOINTMENT_SERVICE_URL    (port 3003)  → /api/v1/appointments/*
 *   /api/prescriptions/* → PRESCRIPTION_SERVICE_URL   (port 3004)  → /api/v1/prescriptions/*
 *   /api/billing/*       → BILLING_SERVICE_URL        (port 3005)  → /api/v1/billing/*
 *   /api/notifications/* → NOTIFICATION_SERVICE_URL   (port 3006)  → /api/v1/notifications/*
 *   /api/analytics/*     → ANALYTICS_SERVICE_URL      (port 3007)  → /api/v1/analytics/*
 *
 * Special routes (handled locally, NOT proxied):
 *   GET /health          → gateway liveness probe
 *   GET /api/health      → aggregated downstream health check
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';
import type { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import https from 'https';

// ─── Environment ─────────────────────────────────────────────────────────────

const PORT        = parseInt(process.env.PORT ?? '3000', 10);
const NODE_ENV    = process.env.NODE_ENV ?? 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';

const SERVICE_URLS = {
  auth:          process.env.AUTH_SERVICE_URL          ?? 'http://localhost:3001',
  patient:       process.env.PATIENT_SERVICE_URL       ?? 'http://localhost:3002',
  appointment:   process.env.APPOINTMENT_SERVICE_URL   ?? 'http://localhost:3003',
  prescription:  process.env.PRESCRIPTION_SERVICE_URL  ?? 'http://localhost:3004',
  billing:       process.env.BILLING_SERVICE_URL       ?? 'http://localhost:3005',
  notification:  process.env.NOTIFICATION_SERVICE_URL  ?? 'http://localhost:3006',
  analytics:     process.env.ANALYTICS_SERVICE_URL     ?? 'http://localhost:3007',
} as const;

type ServiceName = keyof typeof SERVICE_URLS;

// ─── Application ──────────────────────────────────────────────────────────────

const app: Application = express();

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Correlation-Id'],
  })
);

// ─── Request ID ───────────────────────────────────────────────────────────────
// Attach a unique ID to every request so logs are traceable across services.

app.use((req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) ?? uuidv4();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// ─── Request Logging ──────────────────────────────────────────────────────────
// morgan 'combined' includes IP, method, path, status, response-time.

morgan.token('request-id', (req: Request) => (req as any).requestId ?? '-');
app.use(
  morgan(':request-id :method :url :status :res[content-length] - :response-time ms', {
    skip: (req) => req.url === '/health', // suppress noisy liveness probes
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// IMPORTANT: Do NOT add express.json() / express.urlencoded() here.
// This gateway is a pure reverse proxy. Parsing the body at the gateway
// level consumes the raw request stream; http-proxy-middleware then has
// nothing left to pipe to the downstream service, which causes POST/PUT/PATCH
// requests to stall until the ALB kills them with a 504 Gateway Timeout.
//
// All local gateway routes (/health, /api/health, /api/debug-env) are GET
// endpoints — they never need a request body. Body parsing happens inside
// each downstream microservice for the routes that actually need it.

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10), // 1 minute
  max:      parseInt(process.env.RATE_LIMIT_MAX       ?? '100',   10), // 100 req/min/IP
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    success:    false,
    statusCode: 429,
    message:    'Too many requests. Please slow down and try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10) / 1000),
  },
  handler: (_req, res, _next, options) => {
    res.status(429).json(options.message);
  },
});

// Apply rate limit to all /api/* traffic (proxied AND local).
app.use('/api', apiLimiter);

// ─── Local Health Probe ───────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success:   true,
    service:   'api-gateway',
    version:   '1.0.0',
    status:    'healthy',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  });
});

// ─── Aggregated Downstream Health Check ──────────────────────────────────────
// Calls GET /health on every downstream service concurrently and returns a
// summary. This route is handled locally (not proxied) so it must be
// registered BEFORE the proxy middleware below.

function probeService(name: ServiceName): Promise<{ name: string; status: string; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const url     = new URL('/health', SERVICE_URLS[name]);
    const driver  = url.protocol === 'https:' ? https : http;
    const start   = Date.now();
    const timeout = 3000; // 3 s timeout per service

    const req = driver.get(url.toString(), { timeout }, (res) => {
      const latencyMs = Date.now() - start;
      // Drain the response body so the socket is properly released.
      res.resume();
      const status = res.statusCode === 200 ? 'healthy' : 'degraded';
      resolve({ name, status, latencyMs });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name, status: 'unreachable', latencyMs: Date.now() - start, error: 'Connection timed out' });
    });

    req.on('error', (err) => {
      resolve({ name, status: 'unreachable', latencyMs: Date.now() - start, error: err.message });
    });
  });
}

app.get('/api/health', async (_req: Request, res: Response) => {
  const probes = await Promise.all(
    (Object.keys(SERVICE_URLS) as ServiceName[]).map((name) => probeService(name))
  );

  const allHealthy = probes.every((p) => p.status === 'healthy');
  const httpStatus = allHealthy ? 200 : 207; // 207 Multi-Status when mixed

  res.status(httpStatus).json({
    success:   allHealthy,
    service:   'api-gateway',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    services:  probes,
  });
});

app.get('/api/debug-env', (_req: Request, res: Response) => {
  const serviceEnvs: Record<string, string | undefined> = {};
  for (const key of Object.keys(process.env)) {
    if (key.includes('SERVICE_URL') || key.includes('PORT') || key.includes('HOST')) {
      serviceEnvs[key] = process.env[key];
    }
  }
  res.json({
    success: true,
    envs: serviceEnvs,
    SERVICE_URLS
  });
});

// ─── Proxy Factory ────────────────────────────────────────────────────────────
// Creates a proxy middleware for a given service.
//
// Path rewriting logic:
//   Request arrives at Express as:  /api/patients/123
//   The proxy sees the ORIGINAL full path and rewrites it:
//     /api/patients/123  →  /api/v1/patients/123
//
// All downstream services mount their routers at /api/v1/<resource> internally,
// so we rewrite the public /api/<resource> prefix to /api/v1/<resource>.

function makeProxy(serviceName: ServiceName): ReturnType<typeof createProxyMiddleware> {
  const target  = SERVICE_URLS[serviceName];

  // Public path prefix (what the client sends to the gateway)
  // e.g. patient → "/api/patients"
  const publicPrefixMap: Record<ServiceName, string> = {
    auth:         '/api/auth',
    patient:      '/api/patients',
    appointment:  '/api/appointments',
    prescription: '/api/prescriptions',
    billing:      '/api/billing',
    notification: '/api/notifications',
    analytics:    '/api/analytics',
  };

  // Internal path prefix (what the downstream service actually listens on)
  // All services use /api/v1/<resource> internally.
  const internalPrefixMap: Record<ServiceName, string> = {
    auth:         '/api/v1/auth',
    patient:      '/api/v1/patients',
    appointment:  '/api/v1/appointments',
    prescription: '/api/v1/prescriptions',
    billing:      '/api/v1/billing',
    notification: '/api/v1/notifications',
    analytics:    '/api/v1/analytics',
  };

  const publicPrefix   = publicPrefixMap[serviceName];
  const internalPrefix = internalPrefixMap[serviceName];

  // ── http-proxy-middleware v2 uses flat top-level callbacks, NOT the nested
  //    `on: { proxyReq, error }` syntax introduced in v3. ──────────────────
  const options: ProxyOptions = {
    target,
    changeOrigin: true,

    // Rewrite: /api/patients/123  →  /api/v1/patients/123
    pathRewrite: { [`^${publicPrefix}`]: internalPrefix },

    // Forward X-Request-Id upstream for end-to-end tracing (v2 flat API).
    onProxyReq: (proxyReq, req: IncomingMessage) => {
      const rid = (req as any).requestId;
      if (rid) proxyReq.setHeader('X-Request-Id', rid);
      console.info(`[Proxy → ${serviceName}] ${(req as any).method} ${(req as any).url} → ${target}${proxyReq.path}`);
    },

    // Return a structured 502 instead of crashing when the upstream is down (v2 flat API).
    onError: (err: Error, req: IncomingMessage, res: ServerResponse) => {
      console.error(`[Proxy ✗ ${serviceName}] ${(req as any).method} ${(req as any).url} — ${err.message}`);

      if (res.headersSent) return;

      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success:    false,
          statusCode: 502,
          message:    'Service unavailable',
          service:    serviceName,
          error:      NODE_ENV !== 'production' ? err.message : undefined,
          timestamp:  new Date().toISOString(),
        })
      );
    },
  };

  return createProxyMiddleware(publicPrefix, options);
}

// ─── Proxy Routes ─────────────────────────────────────────────────────────────
// IMPORTANT: These MUST be registered AFTER the local /api/health handler.
// Express matches routes in registration order — first match wins.
//
// The proxy middleware BYPASSES body parsing middleware because it intercepts
// the request before the body has been fully consumed. This is correct
// behaviour: the raw body stream is forwarded as-is to the downstream service.
//
// By mounting the proxy middleware on root app.use() and letting http-proxy-middleware
// handle the path filtering, we prevent Express from truncating the prefix, ensuring
// path rewriting (e.g. /api/patients → /api/v1/patients) functions correctly.

app.use(makeProxy('auth'));
app.use(makeProxy('patient'));
app.use(makeProxy('appointment'));
app.use(makeProxy('prescription'));
app.use(makeProxy('billing'));
app.use(makeProxy('notification'));
app.use(makeProxy('analytics'));

// ─── 404 Catch-All ───────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success:    false,
    statusCode: 404,
    message:    'Route not found',
    timestamp:  new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Gateway] Unhandled error:', err);
  res.status(500).json({
    success:    false,
    statusCode: 500,
    message:    NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp:  new Date().toISOString(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Per spec: server starts listening BEFORE proxies are exercised (they are
// already registered above at import time, but the socket is bound here).

app.listen(PORT, () => {
  console.info(`
┌──────────────────────────────────────────────────────┐
│  HealthBridge API Gateway                            │
│  Listening on port ${String(PORT).padEnd(33)}│
│  Environment: ${NODE_ENV.padEnd(38)}│
├──────────────────────────────────────────────────────┤
│  Proxied routes:                                     │
│    /api/auth/*          → ${SERVICE_URLS.auth.padEnd(26)}│
│    /api/patients/*      → ${SERVICE_URLS.patient.padEnd(26)}│
│    /api/appointments/*  → ${SERVICE_URLS.appointment.padEnd(26)}│
│    /api/prescriptions/* → ${SERVICE_URLS.prescription.padEnd(26)}│
│    /api/billing/*       → ${SERVICE_URLS.billing.padEnd(26)}│
│    /api/notifications/* → ${SERVICE_URLS.notification.padEnd(26)}│
│    /api/analytics/*     → ${SERVICE_URLS.analytics.padEnd(26)}│
└──────────────────────────────────────────────────────┘
  `);
});

export default app;
