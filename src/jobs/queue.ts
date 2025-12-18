import Bull from 'bull';
import redis from '../config/redis';
import { logger } from '../utils/logger';

// Create queues
export const webhookQueue = new Bull('webhook-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export const notificationQueue = new Bull('notification-sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export const priceFetchQueue = new Bull('price-fetching', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Queue event handlers
webhookQueue.on('completed', (job) => {
  logger.info(`Webhook job ${job.id} completed`);
});

webhookQueue.on('failed', (job, err) => {
  logger.error(`Webhook job ${job.id} failed:`, err);
});

notificationQueue.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed:`, err);
});

priceFetchQueue.on('completed', (job) => {
  logger.info(`Price fetch job ${job.id} completed`);
});

priceFetchQueue.on('failed', (job, err) => {
  logger.error(`Price fetch job ${job.id} failed:`, err);
});

logger.info('✅ Job queues initialized');
