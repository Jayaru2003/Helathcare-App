"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = exports.requestLogger = exports.validateRequest = exports.requireRole = exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
/**
 * verifyJWT — Express middleware that validates a Bearer JWT token.
 * On success, attaches the decoded payload to `req.user`.
 * On failure, returns 401 Unauthorized.
 */
const verifyJWT = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret, {
            algorithms: ['HS256'],
        });
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Token has expired. Please log in again.',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
exports.verifyJWT = verifyJWT;
/**
 * requireRole — Factory that returns middleware enforcing a specific role.
 * Must be used AFTER verifyJWT in the middleware chain.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * validateRequest — Factory that returns middleware validating a request
 * object (body, query, or params) against a Zod schema.
 * On failure, returns 422 Unprocessable Entity with field-level errors.
 */
const validateRequest = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[target];
            const parsed = schema.parse(data);
            // Replace the target with the parsed (coerced + validated) value
            req[target] = parsed;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
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
exports.validateRequest = validateRequest;
// ─── Request Logger Middleware ────────────────────────────────────────────────
/**
 * requestLogger — Lightweight request/response logger.
 * Logs method, path, status code, and response time.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        console[level](`[HTTP] ${method} ${originalUrl} → ${statusCode} (${duration}ms)`);
    });
    next();
};
exports.requestLogger = requestLogger;
// ─── Rate Limit Helper ────────────────────────────────────────────────────────
/**
 * Simple in-memory rate limiter (for dev/test). Use express-rate-limit
 * with a Redis store in production.
 */
const createRateLimiter = (maxRequests, windowMs) => {
    const hits = new Map();
    return (req, res, next) => {
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
exports.createRateLimiter = createRateLimiter;
exports.default = {
    verifyJWT: exports.verifyJWT,
    requireRole: exports.requireRole,
    validateRequest: exports.validateRequest,
    requestLogger: exports.requestLogger,
    createRateLimiter: exports.createRateLimiter,
};
//# sourceMappingURL=index.js.map