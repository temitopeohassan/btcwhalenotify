import { logger } from '../utils/logger';

// Placeholder for Stripe integration
// In production, you would integrate with Stripe API

export interface SubscriptionTier {
  name: 'free' | 'pro' | 'enterprise';
  maxAlerts: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'free',
    maxAlerts: 3,
    features: ['Basic alerts', 'Email notifications'],
  },
  pro: {
    name: 'pro',
    maxAlerts: 20,
    features: ['Unlimited alerts', 'Email & Telegram', 'Analytics'],
  },
  enterprise: {
    name: 'enterprise',
    maxAlerts: -1, // Unlimited
    features: ['Everything in Pro', 'API access', 'Custom webhooks', 'Priority support'],
  },
};

export class SubscriptionService {
  async checkLimit(userId: string, tier: string): Promise<boolean> {
    const subscriptionTier = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
    if (subscriptionTier.maxAlerts === -1) {
      return true; // Unlimited
    }

    // In production, check actual alert count from database
    // For now, return true
    return true;
  }

  async getTier(userId: string): Promise<SubscriptionTier> {
    // In production, fetch from database/Stripe
    // For now, return free tier
    return SUBSCRIPTION_TIERS.free;
  }

  async upgrade(userId: string, tier: string): Promise<void> {
    logger.info(`Upgrading user ${userId} to tier ${tier}`);
    // In production, integrate with Stripe checkout
  }

  async cancel(userId: string): Promise<void> {
    logger.info(`Cancelling subscription for user ${userId}`);
    // In production, cancel Stripe subscription
  }
}

export const subscriptionService = new SubscriptionService();
