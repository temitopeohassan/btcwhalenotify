import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { query } from 'express-validator';

const router = Router();

router.use(authenticate);

router.get(
  '/whale-statistics',
  validate([
    query('timeframe').optional().isIn(['24h', '7d', '30d', '90d']),
    query('min_threshold_btc').optional().isFloat({ min: 0 }),
  ]),
  analyticsController.getWhaleStatistics
);

export default router;
