import { logger } from '../utils/logger';
import { webhookQueue } from '../jobs/queue';
import { alertService } from './alert.service';
import { notificationService } from './notification.service';
import { pricingService } from './pricing.service';
import firestore from '../config/database';

export class WebhookService {
  async processChainhook(payload: any) {
    try {
      logger.info('Processing chainhook payload', { payload });

      // Queue the webhook processing job
      await webhookQueue.add({ payload });

      // Also process synchronously for immediate handling
      await this.handleChainhookPayload(payload);
    } catch (error) {
      logger.error('Error processing chainhook', error);
      throw error;
    }
  }

  private async handleChainhookPayload(payload: any) {
    // Extract transaction data from chainhook payload
    const transactions = this.extractTransactions(payload);

    for (const tx of transactions) {
      const amountBtc = await pricingService.convertSatsToBtc(tx.amountSats);
      const amountUsd = await pricingService.convertSatsToUsd(tx.amountSats);

      // Check all active alerts
      const alertsSnapshot = await alertService.list('mcp-user', 'active');

      for (const alert of alertsSnapshot) {
        if (this.shouldTriggerAlert(alert, amountBtc, tx)) {
          await this.triggerAlert(alert, {
            amount: amountBtc,
            amountUsd,
            txid: tx.txid,
            fromAddresses: tx.fromAddresses || [],
            toAddresses: tx.toAddresses || [],
            blockHeight: tx.blockHeight || 0,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  private extractTransactions(payload: any): Array<{
    txid: string;
    amountSats: number;
    fromAddresses?: string[];
    toAddresses?: string[];
    blockHeight?: number;
  }> {
    const transactions: Array<{
      txid: string;
      amountSats: number;
      fromAddresses?: string[];
      toAddresses?: string[];
      blockHeight?: number;
    }> = [];

    if (payload.apply && Array.isArray(payload.apply)) {
      for (const apply of payload.apply) {
        if (apply.transaction) {
          transactions.push({
            txid: apply.transaction.transaction_identifier?.hash || '',
            amountSats: this.calculateTotalOutput(apply.transaction),
            blockHeight: apply.block_identifier?.index,
          });
        }
      }
    }

    return transactions;
  }

  private calculateTotalOutput(transaction: any): number {
    if (transaction.operations && Array.isArray(transaction.operations)) {
      return transaction.operations.reduce((sum: number, op: any) => {
        if (op.type === 'transfer' && op.amount) {
          return sum + Math.abs(parseInt(op.amount.value || '0'));
        }
        return sum;
      }, 0);
    }
    return 0;
  }

  private shouldTriggerAlert(
    alert: any,
    amountBtc: number,
    tx: { fromAddresses?: string[]; toAddresses?: string[] }
  ): boolean {
    // Check threshold
    if (amountBtc < alert.threshold_btc) {
      return false;
    }

    // Check if addresses match (if specified)
    if (alert.addresses && alert.addresses.length > 0) {
      const allAddresses = [
        ...(tx.fromAddresses || []),
        ...(tx.toAddresses || []),
      ];
      const hasMatchingAddress = alert.addresses.some((addr: string) =>
        allAddresses.includes(addr)
      );
      if (!hasMatchingAddress) {
        return false;
      }
    }

    return alert.status === 'active';
  }

  private async triggerAlert(alert: any, notificationData: any) {
    // Save to alert history
    await firestore.collection('alert_history').add({
      alertId: alert.id,
      amountBtc: notificationData.amount,
      amountUsd: notificationData.amountUsd,
      txid: notificationData.txid,
      fromAddresses: notificationData.fromAddresses,
      toAddresses: notificationData.toAddresses,
      blockHeight: notificationData.blockHeight,
      timestamp: notificationData.timestamp,
    });

    // Send notifications
    const recipients = {
      email: process.env.EMAIL_TO,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
    };

    await notificationService.sendNotification(
      alert.notification_channels,
      notificationData,
      recipients
    );

    logger.info(`Alert triggered: ${alert.id} for transaction ${notificationData.txid}`);
  }
}

export const webhookService = new WebhookService();
