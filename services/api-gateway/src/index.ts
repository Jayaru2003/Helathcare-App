import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import router from './routes/index';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// ─── Request ID ────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).requestId = req.headers['x-request-id'] ?? uuidv4();
  next();
});

// ─── Logging ───────────────────────────────────────────────────────────────
app.use(morgan('combined'));

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'api-gateway',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Gateway] Unhandled error:', err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.info(`[API Gateway] Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

export default app;
