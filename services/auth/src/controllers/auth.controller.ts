import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User registered successfully',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Token refreshed',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      if (token) await AuthService.revokeToken(token);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      if (!token) {
        res.status(401).json({ success: false, statusCode: 401, message: 'No token provided' });
        return;
      }
      const user = await AuthService.validateToken(token);
      res.json({
        success: true,
        statusCode: 200,
        message: 'User retrieved',
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
