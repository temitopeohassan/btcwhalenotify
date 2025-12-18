import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  async getWhaleStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const timeframe = (req.query.timeframe as string) || '24h';
      const minThresholdBtc = req.query.min_threshold_btc
        ? parseFloat(req.query.min_threshold_btc as string)
        : 100;

      const statistics = await analyticsService.getWhaleStatistics(
        userId,
        timeframe as '24h' | '7d' | '30d' | '90d',
        minThresholdBtc
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
