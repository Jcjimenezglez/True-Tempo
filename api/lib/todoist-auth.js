const crypto = require('crypto');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { checkProStatus } = require('../_check-pro-status');

const TODOIST_PRIVATE_KEY = 'todoistIntegration';
const STATE_TTL_MS = 10 * 60 * 1000;

function parseRequestUrl(req) {
  try {
    return new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  } catch (_) {
    return null;
  }
}

function getQueryParam(req, key) {
  if (req.query && req.query[key] !== undefined) {
    return String(req.query[key]);
  }
  const parsed = parseRequestUrl(req);
  if (!parsed) return '';
  return parsed.searchParams.get(key) || '';
}

function getRequestedUserId(req) {
  const fromHeader = (req.headers['x-clerk-userid'] || '').toString().trim();
  if (fromHeader) return fromHeader;
  return getQueryParam(req, 'uid').trim();
}

function getOrigin(req) {
  const headerProto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim();
  const proto = headerProto || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function getCallbackUrl(req) {
  return process.env.TODOIST_OAUTH_REDIRECT_URI || `${getOrigin(req)}/api/todoist-auth-callback`;
}

function getStateSigningSecret() {
  return process.env.TODOIST_STATE_SECRET || process.env.CLERK_SECRET_KEY || '';
}

function signPayload(payload) {
  const secret = getStateSigningSecret();
  if (!secret) {
    throw new Error('TODOIST_STATE_SECRET or CLERK_SECRET_KEY is required');
  }
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function encodeState(stateObj) {
  const payload = Buffer.from(JSON.stringify(stateObj), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeState(stateToken) {
  if (!stateToken || typeof stateToken !== 'string' || !stateToken.includes('.')) {
    throw new Error('Invalid state');
  }
  const [payload, signature] = stateToken.split('.');
  const expectedSig = signPayload(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid state signature');
  }
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid state payload');
  }
  if (!parsed.uid) {
    throw new Error('Missing uid in state');
  }
  if (!parsed.exp || Date.now() > Number(parsed.exp)) {
    throw new Error('Expired state');
  }
  return parsed;
}

function createOAuthState({ userId, devMode = false }) {
  return encodeState({
    uid: userId,
    dev: Boolean(devMode),
    exp: Date.now() + STATE_TTL_MS,
    nonce: crypto.randomBytes(12).toString('hex'),
  });
}

async function getClerkClient() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

async function getUserAndTodoistToken(userId) {
  const clerk = await getClerkClient();
  const user = await clerk.users.getUser(userId);
  const integration = user?.privateMetadata?.[TODOIST_PRIVATE_KEY];
  const accessToken =
    integration && typeof integration === 'object' ? integration.accessToken || '' : '';
  return { clerk, user, accessToken, integration };
}

async function persistTodoistToken(userId, accessToken) {
  const clerk = await getClerkClient();
  const user = await clerk.users.getUser(userId);
  const nextPrivateMetadata = {
    ...(user.privateMetadata || {}),
    [TODOIST_PRIVATE_KEY]: {
      accessToken,
      connectedAt: new Date().toISOString(),
    },
  };
  await clerk.users.updateUser(userId, { privateMetadata: nextPrivateMetadata });
}

async function clearTodoistToken(userId) {
  const clerk = await getClerkClient();
  const user = await clerk.users.getUser(userId);
  const currentPrivateMetadata = { ...(user.privateMetadata || {}) };
  delete currentPrivateMetadata[TODOIST_PRIVATE_KEY];
  await clerk.users.updateUser(userId, { privateMetadata: currentPrivateMetadata });
}

async function requireProContext(req) {
  const status = await checkProStatus(req);
  if (!status.isPro) {
    return {
      ok: false,
      status: status.error === 'Not authenticated' ? 401 : 403,
      error: status.error || 'Pro plan required',
    };
  }
  return { ok: true, userId: status.userId, devMode: Boolean(status.devMode) };
}

module.exports = {
  TODOIST_PRIVATE_KEY,
  getRequestedUserId,
  getOrigin,
  getCallbackUrl,
  createOAuthState,
  decodeState,
  getClerkClient,
  getUserAndTodoistToken,
  persistTodoistToken,
  clearTodoistToken,
  requireProContext,
  getQueryParam,
};
