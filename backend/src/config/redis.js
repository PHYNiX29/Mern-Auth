import { Redis } from 'ioredis';
import logger from './logger.js';

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,   // Must be true so RedisStore init can queue until connected
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 5) {
        logger.error('Redis max reconnect attempts reached');
        return null; // stop retrying
      }
      const delay = Math.min(times * 200, 2000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  redisClient.on('reconnecting', () => logger.info('Redis reconnecting...'));

  return redisClient;
};

export default getRedisClient;
