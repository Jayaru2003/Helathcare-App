import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';

// ─── JWT Auth Middleware ──────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // User ID
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'staff';
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * verifyJWT — Express middleware that validates a Bearer JWT token.
 * On success, attaches the decoded payload to `req.user`.
 * On failure, returns 401 Unauthorized.
 */
export const verifyJWT: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('[verifyJWT] JWT_SECRET environment variable is not set!');
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error: auth configuration missing',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Invalid token signature.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token verification failed.',
    });
  }
};

/**
 * requireRole — Factory that returns middleware enforcing a specific role.
 * Must be used AFTER verifyJWT in the middleware chain.
 */
export const requireRole = (
  ...roles: JwtPayload['role'][]
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

// ─── Request Validation Middleware ───────────────────────────────────────────

export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * validateRequest — Factory that returns middleware validating a request
 * object (body, query, or params) against a Zod schema.
 * On failure, returns 422 Unprocessable Entity with field-level errors.
 */
export const validateRequest = <T>(
  schema: ZodSchema<T>,
  target: ValidationTarget = 'body'
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const parsed = schema.parse(data);

      // Replace the target with the parsed (coerced + validated) value
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        res.status(422).json({
          success: false,
          statusCode: 422,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      // Unknown error — pass to global error handler
      next(err);
    }
  };
};

// ─── Request Logger Middleware ────────────────────────────────────────────────

/**
 * requestLogger — Lightweight request/response logger.
 * Logs method, path, status code, and response time.
 */
export const requestLogger: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    console[level](
      `[HTTP] ${method} ${originalUrl} → ${statusCode} (${duration}ms)`
    );
  });

  next();
};

// ─── Rate Limit Helper ────────────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter (for dev/test). Use express-rate-limit
 * with a Redis store in production.
 */
export const createRateLimiter = (
  maxRequests: number,
  windowMs: number
): RequestHandler => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
};

export default {
  verifyJWT,
  requireRole,
  validateRequest,
  requestLogger,
  createRateLimiter,
};
