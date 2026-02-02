const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

const LEADERBOARD_CACHE_KEY = 'leaderboard:premium:current';

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

const getSnapshot = async () => {
  if (hasKvConfig()) {
    try {
      return await kv.get(LEADERBOARD_CACHE_KEY);
    } catch (error) {
      console.warn('KV read failed, falling back to Redis:', error);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      const raw = await client.get(LEADERBOARD_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Redis read failed:', error);
    }
  }

  return null;
};

const setSnapshot = async (snapshot) => {
  if (hasKvConfig()) {
    try {
      await kv.set(LEADERBOARD_CACHE_KEY, snapshot);
      return true;
    } catch (error) {
      console.warn('KV write failed, falling back to Redis:', error);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      await client.set(LEADERBOARD_CACHE_KEY, JSON.stringify(snapshot));
      return true;
    } catch (error) {
      console.warn('Redis write failed:', error);
    }
  }

  return false;
};

const isCacheConfigured = () => hasKvConfig() || hasRedisConfig();

module.exports = {
  LEADERBOARD_CACHE_KEY,
  getSnapshot,
  setSnapshot,
  isCacheConfigured,
};
