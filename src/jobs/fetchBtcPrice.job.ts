import { priceFetchQueue } from './queue';
import { logger } from '../utils/logger';
import { pricingService } from '../services/pricing.service';

// Fetch BTC price every 5 minutes
priceFetchQueue.add(
  {},
  {
    repeat: { every: 5 * 60 * 1000 }, // 5 minutes
  }
);

priceFetchQueue.process(async (job) => {
  logger.info('Fetching BTC price', { jobId: job.id });

  try {
    const price = await pricingService.getBtcPrice();
    logger.info(`BTC price updated: $${price}`);
    return { price, timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Failed to fetch BTC price:', error);
    throw error;
  }
});
