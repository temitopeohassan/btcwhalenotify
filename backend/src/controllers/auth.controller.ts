import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.signup(email, password, name);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return next(new AppError(error.message, 409));
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return next(new AppError(error.message, 401));
      }
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new AppError('Token required', 401);
      }

      const userId = await authService.verifyToken(token);
      const result = await authService.generateTokens(userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(new AppError('Invalid token', 401));
    }
  }
}

export const authController = new AuthController();
