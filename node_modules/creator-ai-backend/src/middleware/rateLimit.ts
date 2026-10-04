import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface Bucket {
  count: number;
  resetAt: number;
}

export const createRateLimit = (limit: number, windowMs: number) => {
  const buckets = new Map<string, Bucket>();
  let lastCleanupAt = 0;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (now - lastCleanupAt > windowMs) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
      lastCleanupAt = now;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= limit) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      next(new AppError('Too many requests. Please try again shortly.', 429, 'RATE_LIMITED'));
      return;
    }
    bucket.count += 1;
    next();
  };
};
