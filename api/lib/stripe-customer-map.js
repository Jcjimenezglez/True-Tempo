const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

const KEY_PREFIX = 'stripe_cust:';
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

const hasKvConfig = () =>
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const hasRedisConfig = () => !!process.env.REDIS_URL;

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.warn('Redis client error:', err.message));
  }
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

async function setCustomerMapping(stripeCustomerId, clerkUserId) {
  if (!stripeCustomerId || !clerkUserId) return;

  if (hasKvConfig()) {
    try {
      await kv.set(`${KEY_PREFIX}${stripeCustomerId}`, clerkUserId, { ex: TTL_SECONDS });
      return;
    } catch (err) {
      console.warn('KV set stripe customer mapping failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      await client.set(`${KEY_PREFIX}${stripeCustomerId}`, clerkUserId, { EX: TTL_SECONDS });
    } catch (err) {
      console.warn('Redis set stripe customer mapping failed:', err.message);
    }
  }
}

async function getClerkUserIdByCustomer(stripeCustomerId) {
  if (!stripeCustomerId) return null;

  if (hasKvConfig()) {
    try {
      return await kv.get(`${KEY_PREFIX}${stripeCustomerId}`);
    } catch (err) {
      console.warn('KV get stripe customer mapping failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      return await client.get(`${KEY_PREFIX}${stripeCustomerId}`);
    } catch (err) {
      console.warn('Redis get stripe customer mapping failed:', err.message);
    }
  }

  return null;
}

module.exports = { setCustomerMapping, getClerkUserIdByCustomer };
