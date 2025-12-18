import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { sendTelegramMessage } from '../utils/telegram';

export interface NotificationData {
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
}

export class NotificationService {
  async sendEmail(data: NotificationData, recipient: string) {
    try {
      const subject = `🐋 Whale Alert: ${data.amount} BTC Transaction Detected`;
      const html = this.formatEmailBody(data);
      await sendEmail(recipient, subject, html);
      logger.info(`Email notification sent to ${recipient}`);
    } catch (error) {
      logger.error('Failed to send email notification', error);
      throw error;
    }
  }

  async sendTelegram(data: NotificationData, chatId: string) {
    try {
      const message = this.formatTelegramMessage(data);
      await sendTelegramMessage(chatId, message);
      logger.info(`Telegram notification sent to ${chatId}`);
    } catch (error) {
      logger.error('Failed to send Telegram notification', error);
      throw error;
    }
  }

  async sendNotification(
    channels: ('email' | 'telegram')[],
    data: NotificationData,
    recipients: {
      email?: string;
      telegramChatId?: string;
    }
  ) {
    const promises: Promise<void>[] = [];

    if (channels.includes('email') && recipients.email) {
      promises.push(this.sendEmail(data, recipients.email));
    }

    if (channels.includes('telegram') && recipients.telegramChatId) {
      promises.push(this.sendTelegram(data, recipients.telegramChatId));
    }

    await Promise.allSettled(promises);
  }

  private formatEmailBody(data: NotificationData): string {
    const metadataHtml = data.metadata
      ? `<p><strong>Metadata:</strong> ${JSON.stringify(data.metadata, null, 2)}</p>`
      : '';

    return `
      <html>
        <body>
          <h2>Large Bitcoin Transaction Detected</h2>
          <p><strong>Amount:</strong> ${data.amount} BTC ($${data.amountUsd.toLocaleString()})</p>
          <p><strong>Transaction ID:</strong> ${data.txid}</p>
          <p><strong>From:</strong> ${data.fromAddresses.join(', ')}</p>
          <p><strong>To:</strong> ${data.toAddresses.join(', ')}</p>
          <p><strong>Block:</strong> ${data.blockHeight}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
          ${metadataHtml}
        </body>
      </html>
    `;
  }

  private formatTelegramMessage(data: NotificationData): string {
    const fromLabels = data.fromLabels?.join(', ') || data.fromAddresses.join(', ');
    const toLabels = data.toLabels?.join(', ') || data.toAddresses.join(', ');
    const explorerUrl = data.explorerUrl || `https://blockstream.info/tx/${data.txid}`;

    return `🐋 *Whale Alert*

💰 *Amount:* ${data.amount} BTC ($${data.amountUsd.toLocaleString()})
🔗 *TX:* \`${data.txid}\`
📤 *From:* ${fromLabels}
📥 *To:* ${toLabels}
⛓️ *Block:* ${data.blockHeight}
🕐 *Time:* ${data.timestamp}

[View on Explorer](${explorerUrl})`;
  }
}

export const notificationService = new NotificationService();
