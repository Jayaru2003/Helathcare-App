import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
export interface JwtPayload {
    sub: string;
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
export declare const verifyJWT: RequestHandler;
/**
 * requireRole — Factory that returns middleware enforcing a specific role.
 * Must be used AFTER verifyJWT in the middleware chain.
 */
export declare const requireRole: (...roles: JwtPayload["role"][]) => RequestHandler;
export type ValidationTarget = 'body' | 'query' | 'params';
/**
 * validateRequest — Factory that returns middleware validating a request
 * object (body, query, or params) against a Zod schema.
 * On failure, returns 422 Unprocessable Entity with field-level errors.
 */
export declare const validateRequest: <T>(schema: ZodSchema<T>, target?: ValidationTarget) => RequestHandler;
/**
 * requestLogger — Lightweight request/response logger.
 * Logs method, path, status code, and response time.
 */
export declare const requestLogger: RequestHandler;
/**
 * Simple in-memory rate limiter (for dev/test). Use express-rate-limit
 * with a Redis store in production.
 */
export declare const createRateLimiter: (maxRequests: number, windowMs: number) => RequestHandler;
declare const _default: {
    verifyJWT: RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    requireRole: (...roles: JwtPayload["role"][]) => RequestHandler;
    validateRequest: <T>(schema: ZodSchema<T>, target?: ValidationTarget) => RequestHandler;
    requestLogger: RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    createRateLimiter: (maxRequests: number, windowMs: number) => RequestHandler;
};
export default _default;
//# sourceMappingURL=index.d.ts.map