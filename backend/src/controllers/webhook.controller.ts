import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class WebhookController {
  async handleChainhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Verify webhook authentication if configured
      const authToken = req.headers['x-auth-token'] as string;
      const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;

      if (expectedToken && authToken !== expectedToken) {
        throw new AppError('Unauthorized', 401);
      }

      const payload = req.body;
      logger.info('Received chainhook webhook', { payload });

      // Process webhook asynchronously
      await webhookService.processChainhook(payload);

      // Respond immediately to chainhook
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error) {
      logger.error('Error processing chainhook webhook', error);
      next(error);
    }
  }
}

export const webhookController = new WebhookController();
