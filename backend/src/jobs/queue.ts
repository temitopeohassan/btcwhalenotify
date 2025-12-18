import Bull from 'bull';
import redis from '../config/redis';
import { logger } from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export const webhookQueue = new Bull('webhook-processing', {
  redis: redisConfig,
});

export const notificationQueue = new Bull('notifications', {
  redis: redisConfig,
});

export const pricingQueue = new Bull('pricing', {
  redis: redisConfig,
});

logger.info('✅ Job queues initialized');