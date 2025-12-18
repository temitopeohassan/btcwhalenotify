import { Router } from 'express';
import authRoutes from './auth.routes';
import alertRoutes from './alert.routes';
import userRoutes from './user.routes';
import webhookRoutes from './webhook.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
