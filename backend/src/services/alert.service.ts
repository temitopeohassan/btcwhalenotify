import { v4 as uuidv4 } from 'uuid';
import firestore from '../config/database';
import { logger } from '../utils/logger';

export interface CreateAlertDto {
  name: string;
  threshold_btc: number;
  addresses?: string[];
  notification_channels: ('email' | 'telegram')[];
  include_metadata?: boolean;
}

export interface UpdateAlertDto {
  threshold_btc?: number;
  addresses?: string[];
  notification_channels?: ('email' | 'telegram')[];
  paused?: boolean;
}

export class AlertService {
  async create(userId: string, data: CreateAlertDto) {
    const alertId = uuidv4();
    const alert = {
      id: alertId,
      userId,
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('alerts').doc(alertId).set(alert);
    logger.info(`Alert created: ${alertId} by user ${userId}`);
    return alert;
  }

  async list(userId: string, status?: string) {
    let query = firestore.collection('alerts').where('userId', '==', userId);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async getById(userId: string, alertId: string) {
    const doc = await firestore.collection('alerts').doc(alertId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return null;
    }

    return data;
  }

  async update(userId: string, alertId: string, data: UpdateAlertDto) {
    const alert = await this.getById(userId, alertId);
    if (!alert) {
      return null;
    }

    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await firestore
      .collection('alerts')
      .doc(alertId)
      .update(updates);

    const updated = await this.getById(userId, alertId);
    logger.info(`Alert updated: ${alertId}`);
    return updated;
  }

  async delete(userId: string, alertId: string) {
    const alert = await this.getById(userId, alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    await firestore.collection('alerts').doc(alertId).delete();
    logger.info(`Alert deleted: ${alertId}`);
  }

  async getHistory(
    userId: string,
    alertId: string,
    options: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const alert = await this.getById(userId, alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    let query = firestore
      .collection('alert_history')
      .where('alertId', '==', alertId)
      .orderBy('timestamp', 'desc')
      .limit(options.limit || 50);

    if (options.startDate) {
      query = query.where('timestamp', '>=', options.startDate);
    }
    if (options.endDate) {
      query = query.where('timestamp', '<=', options.endDate);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data());
  }
}

export const alertService = new AlertService();
