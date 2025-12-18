import { Job } from 'bull';
import { webhookQueue } from './queue';
import { webhookService } from '../services/webhook.service';
import { logger } from '../utils/logger';

export interface ProcessWebhookJobData {
  payload: any;
}

export const processWebhookJob = webhookQueue.process(
  'process-webhook',
  async (job: Job<ProcessWebhookJobData>) => {
    const { payload } = job.data;
    logger.info(`Processing webhook job ${job.id}`);

    try {
      await webhookService.processChainhook(payload);
      logger.info(`Webhook job ${job.id} completed successfully`);
    } catch (error) {
      logger.error(`Webhook job ${job.id} failed:`, error);
      throw error;
    }
  }
);

// Add job to queue
export const addProcessWebhookJob = async (data: ProcessWebhookJobData) => {
  return await webhookQueue.add('process-webhook', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};
