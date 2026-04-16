import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import logger from '../config/logger.js';

/**
 * Build a rate-limit middleware.
 *
 * @param {object} opts
 * @param {number}  opts.windowMs   – time window in ms
 * @param {number}  opts.max        – max requests per window
 * @param {string}  opts.keyPrefix  – Redis key namespace
 * @param {object}  opts.redis      – ioredis client (optional). When provided,
 *                                    uses RedisStore so all backend instances
 *                                    share a single counter. Falls back to the
 *                                    built-in MemoryStore when omitted (handy
 *                                    for local dev without Redis).
 */
export const buildLimiter = ({
  windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max = parseInt(process.env.RATE_LIMIT_MAX) || 100,
  keyPrefix = 'rl',
  redis = null,
} = {}) => {
  let store;

  if (redis) {
    store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `${keyPrefix}:`,
    });
    logger.info(`Rate limiter [${keyPrefix}] using Redis store (${windowMs / 1000}s / ${max} req)`);
  } else {
    logger.warn(`Rate limiter [${keyPrefix}] using in-memory store (no Redis client provided)`);
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,     // RateLimit-* headers per RFC 6585
    legacyHeaders: false,
    ...(store ? { store } : {}),
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res, _next, options) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      logger.warn(`Rate limit exceeded – ip=${req.ip} path=${req.path}`);
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down.',
        retryAfter,
        limit: options.max,
        windowMs,
      });
    },
  });
};
