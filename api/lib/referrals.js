const crypto = require('crypto');
const { kv } = require('@vercel/kv');
const { createClient } = require('redis');

const REFERRAL_CODE_PREFIX = 'referral:code:';
const USER_ACTIVE_CODE_PREFIX = 'referral:user:active:';
const CLAIM_LOCK_PREFIX = 'referral:claim-lock:';
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 365;
const CLAIM_LOCK_TTL_SECONDS = 30;
const CODE_LENGTH = 8;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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

function hasReferralStorage() {
  return hasKvConfig() || hasRedisConfig();
}

function sanitizeReferralCode(value) {
  return (value || '')
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 32);
}

function serialize(value) {
  return JSON.stringify(value);
}

function deserialize(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function generateReferralCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }

  return code;
}

async function setJson(key, value, ttlSeconds = RECORD_TTL_SECONDS) {
  if (hasKvConfig()) {
    try {
      await kv.set(key, serialize(value), { ex: ttlSeconds });
      return true;
    } catch (err) {
      console.warn('KV set referral value failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      await client.set(key, serialize(value), { EX: ttlSeconds });
      return true;
    } catch (err) {
      console.warn('Redis set referral value failed:', err.message);
    }
  }

  return false;
}

async function getJson(key) {
  if (hasKvConfig()) {
    try {
      const value = await kv.get(key);
      const parsed = deserialize(value);
      if (parsed) {
        return parsed;
      }
      if (typeof value === 'string') {
        return value;
      }
    } catch (err) {
      console.warn('KV get referral value failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      return deserialize(await client.get(key));
    } catch (err) {
      console.warn('Redis get referral value failed:', err.message);
    }
  }

  return null;
}

async function deleteKey(key) {
  if (hasKvConfig()) {
    try {
      await kv.del(key);
      return true;
    } catch (err) {
      console.warn('KV delete referral value failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (err) {
      console.warn('Redis delete referral value failed:', err.message);
    }
  }

  return false;
}

async function tryAcquireClaimLock(code) {
  const key = `${CLAIM_LOCK_PREFIX}${code}`;

  if (hasKvConfig()) {
    try {
      const result = await kv.set(key, '1', { ex: CLAIM_LOCK_TTL_SECONDS, nx: true });
      if (result) {
        return true;
      }
    } catch (err) {
      console.warn('KV acquire referral claim lock failed:', err.message);
    }
  }

  if (hasRedisConfig()) {
    try {
      const client = await getRedisClient();
      const result = await client.set(key, '1', { EX: CLAIM_LOCK_TTL_SECONDS, NX: true });
      return result === 'OK';
    } catch (err) {
      console.warn('Redis acquire referral claim lock failed:', err.message);
    }
  }

  return false;
}

async function getReferralByCode(code) {
  const sanitizedCode = sanitizeReferralCode(code);
  if (!sanitizedCode) return null;
  return getJson(`${REFERRAL_CODE_PREFIX}${sanitizedCode}`);
}

async function getUserActiveReferralCode(userId) {
  if (!userId) return null;

  const value = await getJson(`${USER_ACTIVE_CODE_PREFIX}${userId}`);
  const code = typeof value === 'string' ? sanitizeReferralCode(value) : sanitizeReferralCode(value?.code);

  if (!code) {
    return null;
  }

  const record = await getReferralByCode(code);
  if (!record || record.status !== 'active' || record.ownerUserId !== userId) {
    await deleteKey(`${USER_ACTIVE_CODE_PREFIX}${userId}`);
    return null;
  }

  return code;
}

async function createReferralCodeForUser(userId) {
  if (!userId || !hasReferralStorage()) {
    return null;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateReferralCode();
    const existing = await getReferralByCode(code);

    if (existing) {
      continue;
    }

    const now = new Date().toISOString();
    const record = {
      code,
      ownerUserId: userId,
      status: 'active',
      createdAt: now,
      claimedAt: null,
      claimedByUserId: null,
    };

    const saved = await setJson(`${REFERRAL_CODE_PREFIX}${code}`, record);
    if (!saved) {
      return null;
    }

    await setJson(`${USER_ACTIVE_CODE_PREFIX}${userId}`, { code }, RECORD_TTL_SECONDS);
    return code;
  }

  return null;
}

async function ensureReferralCodeForUser(userId) {
  const existingCode = await getUserActiveReferralCode(userId);
  if (existingCode) {
    return existingCode;
  }

  return createReferralCodeForUser(userId);
}

async function claimReferralCode(code, referredUserId) {
  const sanitizedCode = sanitizeReferralCode(code);

  if (!sanitizedCode || !referredUserId || !hasReferralStorage()) {
    return { status: 'invalid' };
  }

  const lockAcquired = await tryAcquireClaimLock(sanitizedCode);
  if (!lockAcquired) {
    return { status: 'expired' };
  }

  const record = await getReferralByCode(sanitizedCode);
  if (!record) {
    return { status: 'invalid' };
  }

  if (record.status !== 'active') {
    return { status: 'expired', ownerUserId: record.ownerUserId };
  }

  if (record.ownerUserId === referredUserId) {
    return { status: 'self' };
  }

  const claimedAt = new Date().toISOString();
  const nextRecord = {
    ...record,
    status: 'claimed',
    claimedAt,
    claimedByUserId: referredUserId,
  };

  await setJson(`${REFERRAL_CODE_PREFIX}${sanitizedCode}`, nextRecord);
  await deleteKey(`${USER_ACTIVE_CODE_PREFIX}${record.ownerUserId}`);

  return {
    status: 'accepted',
    code: sanitizedCode,
    ownerUserId: record.ownerUserId,
    claimedAt,
  };
}

module.exports = {
  claimReferralCode,
  ensureReferralCodeForUser,
  getReferralByCode,
  getUserActiveReferralCode,
  hasReferralStorage,
  sanitizeReferralCode,
};
