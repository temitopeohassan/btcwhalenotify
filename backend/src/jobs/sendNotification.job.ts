import { Job } from 'bull';
import { notificationQueue } from './queue';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export interface SendNotificationJobData {
  channels: ('email' | 'telegram')[];
  data: {
    amount: number;
    amountUsd: number;
    txid: string;
    fromAddresses: string[];
    toAddresses: string[];
    fromLabels?: string[];
    toLabels?: string[];
    blockHeight: number;
    timestamp: string;
    explorerUrl?: string;
    metadata?: any;
  };
  recipients: {
    email?: string;
    telegramChatId?: string;
  };
}

export const sendNotificationJob = notificationQueue.process(
  'send-notification',
  async (job: Job<SendNotificationJobData>) => {
    const { channels, data, recipients } = job.data;
    logger.info(`Sending notification job ${job.id}`);

    try {
      await notificationService.sendNotification(channels, data, recipients);
      logger.info(`Notification job ${job.id} completed successfully`);
    } catch (error) {
      logger.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }
);

// Add job to queue
export const addSendNotificationJob = async (data: SendNotificationJobData) => {
  return await notificationQueue.add('send-notification', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};
