import { notificationQueue } from './queue';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notification.service';

notificationQueue.process(async (job) => {
  const { channels, data, recipients } = job.data;
  logger.info('Sending notification', { jobId: job.id, channels });

  try {
    await notificationService.sendNotification(channels, data, recipients);
    logger.info('Notification sent successfully', { jobId: job.id });
  } catch (error) {
    logger.error('Failed to send notification:', error);
    throw error;
  }
});
