import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body, param, query } from 'express-validator';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('name').isString().trim().notEmpty(),
    body('threshold_btc').isFloat({ min: 0.1 }),
    body('addresses').optional().isArray(),
    body('addresses.*').optional().isString(),
    body('notification_channels').isArray().notEmpty(),
    body('notification_channels.*').isIn(['email', 'telegram']),
    body('include_metadata').optional().isBoolean(),
  ]),
  alertController.create
);

router.get(
  '/',
  validate([
    query('status').optional().isIn(['active', 'paused', 'all']),
  ]),
  alertController.list
);

router.get(
  '/:id',
  validate([param('id').isString().notEmpty()]),
  alertController.getById
);

router.put(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
    body('threshold_btc').optional().isFloat({ min: 0.1 }),
    body('addresses').optional().isArray(),
    body('notification_channels').optional().isArray(),
    body('paused').optional().isBoolean(),
  ]),
  alertController.update
);

router.delete(
  '/:id',
  validate([param('id').isString().notEmpty()]),
  alertController.delete
);

router.get(
  '/:id/history',
  validate([
    param('id').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ]),
  alertController.getHistory
);

export default router;
