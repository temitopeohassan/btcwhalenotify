import axios from 'axios';
import { logger } from '../utils/logger';

const HIRO_API_URL = process.env.HIRO_API_URL!;
const HIRO_API_KEY = process.env.HIRO_API_KEY!;
const WEBHOOK_URL = process.env.CHAINHOOK_WEBHOOK_URL!;

export class ChainhookService {
  async registerAlert(alertId: string, thresholdSatoshis: number, addresses?: string[]) {
    try {
      const predicate: any = {
        scope: 'outputs',
        if_this: {
          output_value: {
            gte: thresholdSatoshis
          }
        }
      };

      if (addresses && addresses.length > 0) {
        predicate.if_this.p2pkh = addresses;
      }

      const response = await axios.post(
        `${HIRO_API_URL}/v1/chainhooks`,
        {
          chain: 'bitcoin',
          uuid: alertId,
          name: `alert-${alertId}`,
          version: 1,
          networks: {
            mainnet: {
              ...predicate,
              then_that: {
                http_post: {
                  url: WEBHOOK_URL,
                  authorization_header: `Bearer ${process.env.WEBHOOK_AUTH_TOKEN}`
                }
              }
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HIRO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Chainhook registered for alert ${alertId}`);
      return response.data.uuid;
    } catch (error: any) {
      logger.error(`Failed to register chainhook:`, error.response?.data || error.message);
      throw error;
    }
  }

  async deleteAlert(chainhookId: string) {
    try {
      await axios.delete(`${HIRO_API_URL}/v1/chainhooks/${chainhookId}`, {
        headers: { 'Authorization': `Bearer ${HIRO_API_KEY}` }
      });
      logger.info(`Chainhook deleted: ${chainhookId}`);
    } catch (error: any) {
      logger.error(`Failed to delete chainhook:`, error.response?.data || error.message);
      throw error;
    }
  }
}

export const chainhookService = new ChainhookService();