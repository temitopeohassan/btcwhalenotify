import { webhookQueue } from './queue';
import { logger } from '../utils/logger';
import { alertService } from '../services/alert.service';
import { pricingService } from '../services/pricing.service';
import { notificationService } from '../services/notification.service';

webhookQueue.process(async (job) => {
  const { payload } = job.data;
  logger.info('Processing webhook payload', { jobId: job.id });

  try {
    // Extract transaction data from chainhook payload
    const transactions = extractTransactions(payload);

    for (const tx of transactions) {
      const amountBtc = await pricingService.convertSatsToBtc(tx.amountSats);
      const amountUsd = await pricingService.convertSatsToUsd(tx.amountSats);

      // Check all active alerts
      const alertsSnapshot = await alertService.list('mcp-user', 'active');

      for (const alert of alertsSnapshot) {
        if (shouldTriggerAlert(alert, amountBtc, tx)) {
          await notificationService.sendNotification(
            alert.notification_channels,
            {
              amount: amountBtc,
              amountUsd,
              txid: tx.txid,
              fromAddresses: tx.fromAddresses || [],
              toAddresses: tx.toAddresses || [],
              blockHeight: tx.blockHeight || 0,
              timestamp: new Date().toISOString(),
            },
            {
              email: process.env.EMAIL_TO,
              telegramChatId: process.env.TELEGRAM_CHAT_ID,
            }
          );
        }
      }
    }
  } catch (error) {
    logger.error('Error processing webhook:', error);
    throw error;
  }
});

function extractTransactions(payload: any): Array<{
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

  if (payload.apply) {
    for (const item of payload.apply) {
      if (item.transaction?.transaction_identifier?.hash) {
        const txid = item.transaction.transaction_identifier.hash;
        const operations = item.transaction.operations || [];
        let totalAmount = 0;

        for (const op of operations) {
          if (op.amount?.value) {
            totalAmount += parseInt(op.amount.value);
          }
        }

        transactions.push({
          txid,
          amountSats: totalAmount,
          blockHeight: item.block_identifier?.index,
        });
      }
    }
  }

  return transactions;
}

function shouldTriggerAlert(alert: any, amountBtc: number, tx: any): boolean {
  if (amountBtc < alert.threshold_btc) {
    return false;
  }

  if (alert.addresses && alert.addresses.length > 0) {
    const txAddresses = [...(tx.fromAddresses || []), ...(tx.toAddresses || [])];
    const hasMatchingAddress = alert.addresses.some((addr: string) =>
      txAddresses.includes(addr)
    );
    if (!hasMatchingAddress) {
      return false;
    }
  }

  return true;
}
