import firestore from '../config/database';
import { logger } from '../utils/logger';

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export class UserService {
  async getProfile(userId: string) {
    const doc = await firestore.collection('users').doc(userId).get();
    if (!doc.exists) {
      throw new Error('User not found');
    }

    const data = doc.data();
    // Remove sensitive data
    const { passwordHash, ...user } = data || {};
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(userId).update(updates);
    logger.info(`User profile updated: ${userId}`);

    return await this.getProfile(userId);
  }

  async deleteAccount(userId: string) {
    // Delete user's alerts
    const alertsSnapshot = await firestore
      .collection('alerts')
      .where('userId', '==', userId)
      .get();

    const deletePromises = alertsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    // Delete user
    await firestore.collection('users').doc(userId).delete();
    logger.info(`User account deleted: ${userId}`);
  }
}

export const userService = new UserService();
