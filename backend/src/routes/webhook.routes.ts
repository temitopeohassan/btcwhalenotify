import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { defaultRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/chainhook',
  defaultRateLimiter,
  webhookController.handleChainhook
);

export default router;
