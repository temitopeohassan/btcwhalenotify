import axios from 'axios';
import { logger } from '../utils/logger';

interface PriceCache {
  price: number;
  timestamp: number;
}

const CACHE_DURATION = 60 * 1000; // 1 minute
let priceCache: PriceCache | null = null;

export class PricingService {
  async getBtcPrice(): Promise<number> {
    // Return cached price if still valid
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return priceCache.price;
    }

    try {
      // Try CoinGecko API
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        { timeout: 5000 }
      );

      const price = response.data.bitcoin.usd;
      priceCache = {
        price,
        timestamp: Date.now(),
      };

      logger.info(`BTC price fetched: $${price}`);
      return price;
    } catch (error) {
      logger.error('Failed to fetch BTC price from CoinGecko', error);

      // Fallback to cached price if available
      if (priceCache) {
        logger.warn('Using cached BTC price');
        return priceCache.price;
      }

      // Default fallback price
      logger.warn('Using default BTC price: $50000');
      return 50000;
    }
  }

  async convertBtcToUsd(btcAmount: number): Promise<number> {
    const price = await this.getBtcPrice();
    return btcAmount * price;
  }

  async convertSatsToBtc(sats: number): Promise<number> {
    return sats / 100000000;
  }

  async convertSatsToUsd(sats: number): Promise<number> {
    const btc = await this.convertSatsToBtc(sats);
    return await this.convertBtcToUsd(btc);
  }
}

export const pricingService = new PricingService();
