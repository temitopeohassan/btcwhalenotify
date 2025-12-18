import { Job } from 'bull';
import { pricingQueue } from './queue';
import { pricingService } from '../services/pricing.service';
import { logger } from '../utils/logger';

export interface FetchBtcPriceJobData {
  // No data needed, just fetch current price
}

export const fetchBtcPriceJob = pricingQueue.process(
  'fetch-btc-price',
  async (job: Job<FetchBtcPriceJobData>) => {
    logger.info(`Fetching BTC price job ${job.id}`);

    try {
      const price = await pricingService.getBtcPrice();
      logger.info(`BTC price fetched: $${price}`);
      return { price };
    } catch (error) {
      logger.error(`Fetch BTC price job ${job.id} failed:`, error);
      throw error;
    }
  }
);

// Schedule recurring job to fetch BTC price every minute
export const scheduleBtcPriceFetch = () => {
  pricingQueue.add(
    'fetch-btc-price',
    {},
    {
      repeat: {
        every: 60 * 1000, // Every minute
      },
    }
  );
  logger.info('Scheduled recurring BTC price fetch job');
};
