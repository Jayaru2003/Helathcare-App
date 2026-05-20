import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthTokens } from '@healthbridge/dto';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['patient', 'doctor', 'admin', 'staff']).default('patient'),
  phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

// In-memory user store for stub (replace with Prisma in production)
const users = new Map<string, { id: string; email: string; passwordHash: string; firstName: string; lastName: string; role: string }>();

export class AuthService {
  static async register(dto: RegisterDto): Promise<{ userId: string; email: string }> {
    if (users.has(dto.email)) {
      throw Object.assign(new Error('User with this email already exists'), { statusCode: 409 });
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const userId = crypto.randomUUID();
    users.set(dto.email, {
      id: userId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });
    return { userId, email: dto.email };
  }

  static async login(dto: LoginDto): Promise<AuthTokens> {
    const user = users.get(dto.email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    return AuthService.generateTokens(user);
  }

  static generateTokens(user: { id: string; email: string; role: string }): AuthTokens {
    const secret = process.env.JWT_SECRET!;
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? secret;
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { algorithm: 'HS256', expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      refreshSecret,
      { algorithm: 'HS256', expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any }
    );
    return { accessToken, refreshToken, expiresIn: 900, tokenType: 'Bearer' };
  }

  static async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!;
      const payload = jwt.verify(token, secret) as { sub: string };
      // In prod: look up user from DB
      return AuthService.generateTokens({ id: payload.sub, email: 'user@example.com', role: 'patient' });
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }
  }

  static async revokeToken(token: string): Promise<void> {
    // In production: add token to Redis blocklist
    console.info('[Auth] Token revoked:', token.substring(0, 20) + '...');
  }

  static async validateToken(token: string): Promise<{ id: string; email: string; role: string }> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; email: string; role: string };
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw Object.assign(new Error('Invalid token'), { statusCode: 401 });
    }
  }
}
