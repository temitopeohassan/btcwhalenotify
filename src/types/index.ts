// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  verificationToken?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alert types
export interface Alert {
  id: string;
  userId: string;
  name: string;
  threshold_btc: number;
  addresses?: string[];
  notification_channels: ('email' | 'telegram')[];
  include_metadata?: boolean;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  txid: string;
  amountBtc: number;
  amountUsd: number;
  fromAddresses: string[];
  toAddresses: string[];
  blockHeight: number;
  timestamp: string;
  metadata?: any;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Chainhook types
export interface ChainhookPayload {
  apply?: Array<{
    transaction?: {
      transaction_identifier?: {
        hash: string;
      };
      operations?: Array<{
        type: string;
        amount?: {
          value: string;
          currency: {
            symbol: string;
          };
        };
      }>;
    };
    block_identifier?: {
      index: number;
      hash: string;
    };
  }>;
  rollback?: any[];
}

// Request/Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
