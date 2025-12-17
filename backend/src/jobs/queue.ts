import Bull from 'bull';
import redis from '../config/redis';
import { logger } from '../utils/logger';

export const webhookQueue = new Bull('webhook-processing', {
  redis: process.env.REDIS_URL
});

export const notificationQueue = new Bull('notifications', {
  redis: process.env.REDIS_URL
});

// Process webhook events
webhookQueue.process(async (job) => {
  logger.info(`Processing webhook job ${job.id}`);
  const { processWebhookJob } = await import('./processWebhook.job');
  return processWebhookJob(job.data);
});

// Process notifications
notificationQueue.process(async (job) => {
  logger.info(`Processing notification job ${job.id}`);
  const { sendNotificationJob } = await import('./sendNotification.job');
  return sendNotificationJob(job.data);
});

logger.info('✅ Job queues initialized');