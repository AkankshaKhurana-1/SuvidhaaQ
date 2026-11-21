import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { registerPatientSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
import { AuthenticatedRequest } from '../middleware/authenticate';

const authService = new AuthService();

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerPatientSchema.parse(req.body);
      const result = await authService.registerPatient(parsed);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refreshTokenSchema.parse(req.body);
      const result = await authService.refresh(parsed.refreshToken);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body || {};
      const result = await authService.logout(refreshToken, req.user?.id);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.getMe(req.user!.id);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
