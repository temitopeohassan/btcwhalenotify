import firestore from '../config/database';
import { logger } from '../utils/logger';

export interface WhaleStatistics {
  totalTransactions: number;
  totalVolumeBtc: number;
  totalVolumeUsd: number;
  averageTransactionSize: number;
  largestTransaction: {
    txid: string;
    amount: number;
    timestamp: string;
  };
  timeframe: string;
}

export class AnalyticsService {
  async getWhaleStatistics(
    userId: string,
    timeframe: '24h' | '7d' | '30d' | '90d',
    minThresholdBtc: number
  ): Promise<WhaleStatistics> {
    const now = new Date();
    const startDate = this.getStartDate(now, timeframe);

    // Get user's alerts
    const alertsSnapshot = await firestore
      .collection('alerts')
      .where('userId', '==', userId)
      .get();

    const alertIds = alertsSnapshot.docs.map((doc) => doc.id);

    if (alertIds.length === 0) {
      return this.getEmptyStatistics(timeframe);
    }

    // Get alert history for user's alerts
    const historySnapshot = await firestore
      .collection('alert_history')
      .where('alertId', 'in', alertIds)
      .where('timestamp', '>=', startDate.toISOString())
      .where('amountBtc', '>=', minThresholdBtc)
      .get();

    const transactions = historySnapshot.docs.map((doc) => doc.data());

    if (transactions.length === 0) {
      return this.getEmptyStatistics(timeframe);
    }

    const totalVolumeBtc = transactions.reduce(
      (sum, tx) => sum + (tx.amountBtc || 0),
      0
    );
    const totalVolumeUsd = transactions.reduce(
      (sum, tx) => sum + (tx.amountUsd || 0),
      0
    );

    const largestTransaction = transactions.reduce((largest, tx) => {
      return (tx.amountBtc || 0) > (largest.amountBtc || 0) ? tx : largest;
    }, transactions[0]);

    return {
      totalTransactions: transactions.length,
      totalVolumeBtc,
      totalVolumeUsd,
      averageTransactionSize: totalVolumeBtc / transactions.length,
      largestTransaction: {
        txid: largestTransaction.txid || '',
        amount: largestTransaction.amountBtc || 0,
        timestamp: largestTransaction.timestamp || '',
      },
      timeframe,
    };
  }

  private getStartDate(now: Date, timeframe: string): Date {
    const date = new Date(now);
    switch (timeframe) {
      case '24h':
        date.setHours(date.getHours() - 24);
        break;
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      default:
        date.setHours(date.getHours() - 24);
    }
    return date;
  }

  private getEmptyStatistics(timeframe: string): WhaleStatistics {
    return {
      totalTransactions: 0,
      totalVolumeBtc: 0,
      totalVolumeUsd: 0,
      averageTransactionSize: 0,
      largestTransaction: {
        txid: '',
        amount: 0,
        timestamp: '',
      },
      timeframe,
    };
  }
}

export const analyticsService = new AnalyticsService();
