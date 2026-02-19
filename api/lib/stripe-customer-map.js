const { kv } = require('@vercel/kv');

const KEY_PREFIX = 'stripe_cust:';
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

const hasKvConfig = () =>
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

async function setCustomerMapping(stripeCustomerId, clerkUserId) {
  if (!stripeCustomerId || !clerkUserId || !hasKvConfig()) return;
  try {
    await kv.set(`${KEY_PREFIX}${stripeCustomerId}`, clerkUserId, { ex: TTL_SECONDS });
  } catch (err) {
    console.warn('KV set stripe customer mapping failed:', err.message);
  }
}

async function getClerkUserIdByCustomer(stripeCustomerId) {
  if (!stripeCustomerId || !hasKvConfig()) return null;
  try {
    return await kv.get(`${KEY_PREFIX}${stripeCustomerId}`);
  } catch (err) {
    console.warn('KV get stripe customer mapping failed:', err.message);
    return null;
  }
}

module.exports = { setCustomerMapping, getClerkUserIdByCustomer };
