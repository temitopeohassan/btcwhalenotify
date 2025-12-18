import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middleware/errorHandler';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const user = await userService.getProfile(userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const user = await userService.updateProfile(userId, req.body);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      await userService.deleteAccount(userId);
      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
