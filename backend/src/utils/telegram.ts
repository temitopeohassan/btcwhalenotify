import axios from 'axios';
import { logger } from './logger';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export interface TelegramMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: TelegramMessageOptions
): Promise<void> {
  if (!BOT_TOKEN) {
    logger.warn('Telegram bot token not configured. Skipping Telegram message.');
    return;
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'Markdown',
      disable_web_page_preview: options?.disable_web_page_preview,
      disable_notification: options?.disable_notification,
    });

    logger.info(`Telegram message sent to ${chatId}: ${response.data.result.message_id}`);
  } catch (error: any) {
    logger.error('Failed to send Telegram message', {
      error: error.response?.data || error.message,
      chatId,
    });
    throw error;
  }
}

export async function sendTelegramPhoto(
  chatId: string,
  photo: string | Buffer,
  caption?: string
): Promise<void> {
  if (!BOT_TOKEN) {
    logger.warn('Telegram bot token not configured. Skipping Telegram photo.');
    return;
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (typeof photo === 'string') {
      formData.append('photo', photo);
    } else {
      formData.append('photo', new Blob([photo]));
    }
    if (caption) {
      formData.append('caption', caption);
    }

    await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    logger.info(`Telegram photo sent to ${chatId}`);
  } catch (error: any) {
    logger.error('Failed to send Telegram photo', {
      error: error.response?.data || error.message,
      chatId,
    });
    throw error;
  }
}

export async function getTelegramUpdates(): Promise<any[]> {
  if (!BOT_TOKEN) {
    return [];
  }

  try {
    const url = `${TELEGRAM_API_URL}${BOT_TOKEN}/getUpdates`;
    const response = await axios.get(url);
    return response.data.result || [];
  } catch (error: any) {
    logger.error('Failed to get Telegram updates', error);
    return [];
  }
}
