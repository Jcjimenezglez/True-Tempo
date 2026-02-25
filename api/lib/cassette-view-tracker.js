const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

const KEY_PREFIX = 'cassette_viewers:';
const TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days
const MEMORY_TTL_MS = TTL_SECONDS * 1000;

const hasKvConfig = () =>
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const hasRedisConfig = () => !!process.env.REDIS_URL;

let redisClient = null;
const memoryViewState = new Map();

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.warn('Redis cassette view tracker error:', err.message);
    });
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

function markUniqueViewInMemory(cassetteId, viewerUserId) {
  const now = Date.now();
  const key = `${KEY_PREFIX}${cassetteId}`;
  const existing = memoryViewState.get(key);

  const state =
    existing && existing.expiresAt > now
      ? existing
      : { viewers: new Set(), expiresAt: now + MEMORY_TTL_MS };

  const isNew = !state.viewers.has(viewerUserId);
  if (isNew) {
    state.viewers.add(viewerUserId);
  }
  memoryViewState.set(key, state);

  if (memoryViewState.size > 1000) {
    for (const [entryKey, entryValue] of memoryViewState) {
      if (!entryValue || entryValue.expiresAt <= now) {
        memoryViewState.delete(entryKey);
      }
    }
  }

  return isNew;
}

async function markUniqueView(cassetteId, viewerUserId) {
  if (!cassetteId || !viewerUserId) return false;
  const key = `${KEY_PREFIX}${cassetteId}`;

  if (hasKvConfig()) {
    try {
      const added = await kv.sadd(key, viewerUserId);
      if (Number(added) > 0) {
        await kv.expire(key, TTL_SECONDS);
      }
      return Number(added) > 0;
    } catch (err) {
      console.warn('KV markUniqueView failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      const added = await client.sAdd(key, viewerUserId);
      if (Number(added) > 0) {
        await client.expire(key, TTL_SECONDS);
      }
      return Number(added) > 0;
    } catch (err) {
      console.warn('Redis markUniqueView failed:', err.message);
    }
  }

  return markUniqueViewInMemory(cassetteId, viewerUserId);
}

module.exports = { markUniqueView };

