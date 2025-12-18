import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';
import { defaultRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/signup',
  defaultRateLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().isString().trim(),
  ]),
  authController.signup
);

router.post(
  '/login',
  defaultRateLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  authController.login
);

router.post('/refresh', authController.refreshToken);

export default router;
