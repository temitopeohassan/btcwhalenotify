import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

function getClientIdentifier(req: Request): string {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = 'Too many requests' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getClientIdentifier(req);
    const now = Date.now();

    cleanupExpiredEntries();

    if (!store[identifier] || store[identifier].resetTime < now) {
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (store[identifier].count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
      return res.status(429).json({
        success: false,
        error: {
          message,
          retryAfter: Math.ceil((store[identifier].resetTime - now) / 1000),
        },
      });
    }

    store[identifier].count++;
    next();
  };
};

export const defaultRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});
