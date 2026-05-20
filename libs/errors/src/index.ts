import { Request, Response, NextFunction } from 'express';
import { logger } from '@healthbridge/logger';

// ─── HTTP Status Code Map ─────────────────────────────────────────────────────

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// ─── AppError Class ───────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    options: {
      isOperational?: boolean;
      code?: string;
      details?: unknown;
    } = {},
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.details = options.details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
    };
  }
}

// ─── Specific Error Classes ───────────────────────────────────────────────────

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, { code: 'BAD_REQUEST', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, { code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, { code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, { code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT, { code: 'CONFLICT' });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, {
      code: 'VALIDATION_ERROR',
      details,
    });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, { code: 'RATE_LIMIT_EXCEEDED' });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, {
      code: 'SERVICE_UNAVAILABLE',
      isOperational: false,
    });
  }
}

// ─── Global Error Handler Middleware ──────────────────────────────────────────

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Normalize to AppError
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    // Prisma / MongoDB / unknown errors
    appError = normalizeError(err);
  }

  // Log the error
  if (!appError.isOperational || appError.statusCode >= 500) {
    logger.error('Unhandled error', {
      message: appError.message,
      statusCode: appError.statusCode,
      code: appError.code,
      stack: appError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Operational error', {
      message: appError.message,
      statusCode: appError.statusCode,
      code: appError.code,
      url: req.url,
      method: req.method,
    });
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message: appError.isOperational ? appError.message : 'An unexpected error occurred',
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details,
      ...(isDev && { stack: appError.stack }),
    },
    timestamp: new Date().toISOString(),
    requestId: (req.headers['x-request-id'] as string) || undefined,
  };

  res.status(appError.statusCode).json(response);
}

// ─── Error Normalizer ────────────────────────────────────────────────────────

function normalizeError(err: Error): AppError {
  const message = err.message || 'Unknown error';

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as Error & { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      return new ConflictError(
        `Unique constraint violation on: ${prismaErr.meta?.target?.join(', ')}`,
      );
    }
    if (prismaErr.code === 'P2025') {
      return new NotFoundError('Record');
    }
    return new BadRequestError(`Database error: ${message}`);
  }

  // Mongoose validation errors
  if (err.constructor.name === 'ValidationError' && 'errors' in err) {
    return new ValidationError('Mongoose validation failed', (err as any).errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  // SyntaxError (malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    return new BadRequestError('Invalid JSON body');
  }

  return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, {
    isOperational: false,
    code: 'INTERNAL_ERROR',
  });
}

// ─── Async Handler Wrapper ────────────────────────────────────────────────────

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

// ─── Not Found Handler ────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.url}`));
}
