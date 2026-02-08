const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

const STATS_CACHE_KEY = 'stats:public:users';

const hasKvConfig = () =>
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const hasRedisConfig = () => !!process.env.REDIS_URL;

let redisClient = null;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (error) => {
      console.warn('Redis client error:', error);
    });
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};

const getCachedStats = async () => {
  if (hasKvConfig()) {
    try {
      return await kv.get(STATS_CACHE_KEY);
    } catch (error) {
      console.warn('KV read failed, falling back to Redis:', error);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      const raw = await client.get(STATS_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Redis read failed:', error);
    }
  }

  return null;
};

const setCachedStats = async (stats, ttlSeconds) => {
  if (hasKvConfig()) {
    try {
      await kv.set(STATS_CACHE_KEY, stats, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.warn('KV write failed, falling back to Redis:', error);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      await client.set(STATS_CACHE_KEY, JSON.stringify(stats), { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.warn('Redis write failed:', error);
    }
  }

  return false;
};

module.exports = {
  getCachedStats,
  setCachedStats,
};
