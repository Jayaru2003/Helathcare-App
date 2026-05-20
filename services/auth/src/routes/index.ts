import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '@healthbridge/middleware';
import { loginSchema, registerSchema, refreshSchema } from '../services/auth.service';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validateRequest(registerSchema), AuthController.register);

// POST /api/v1/auth/login
router.post('/login', validateRequest(loginSchema), AuthController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validateRequest(refreshSchema), AuthController.refresh);

// POST /api/v1/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/v1/auth/me
router.get('/me', AuthController.me);

export default router;
