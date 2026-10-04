"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimit = void 0;
const errorHandler_js_1 = require("./errorHandler.js");
const createRateLimit = (limit, windowMs) => {
    const buckets = new Map();
    let lastCleanupAt = 0;
    return (req, res, next) => {
        const now = Date.now();
        if (now - lastCleanupAt > windowMs) {
            for (const [key, bucket] of buckets) {
                if (bucket.resetAt <= now)
                    buckets.delete(key);
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
            next(new errorHandler_js_1.AppError('Too many requests. Please try again shortly.', 429, 'RATE_LIMITED'));
            return;
        }
        bucket.count += 1;
        next();
    };
};
exports.createRateLimit = createRateLimit;
