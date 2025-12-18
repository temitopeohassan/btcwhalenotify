import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service';
import { AppError } from '../middleware/errorHandler';

export class AlertController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const alert = await alertService.create(userId, req.body);
      res.status(201).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const status = req.query.status as string | undefined;
      const alerts = await alertService.list(userId, status);
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const alert = await alertService.getById(userId, req.params.id);
      if (!alert) {
        throw new AppError('Alert not found', 404);
      }
      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const alert = await alertService.update(userId, req.params.id, req.body);
      if (!alert) {
        throw new AppError('Alert not found', 404);
      }
      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      await alertService.delete(userId, req.params.id);
      res.json({
        success: true,
        message: 'Alert deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { limit, start_date, end_date } = req.query;
      const history = await alertService.getHistory(
        userId,
        req.params.id,
        {
          limit: limit ? parseInt(limit as string) : 50,
          startDate: start_date as string | undefined,
          endDate: end_date as string | undefined,
        }
      );
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
