const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { pruneMetadataToBudget } = require('./lib/clerk-metadata-utils');
const {
  ensureReferralCodeForUser,
  getReferralByCode,
  getUserActiveReferralCode,
  hasReferralStorage,
  sanitizeReferralCode,
} = require('./lib/referrals');

const APP_BASE_URL = 'https://www.superfocus.live';

function buildReferralPayload(user, activeCode, options = {}) {
  const metadata = user?.publicMetadata || {};
  const hasExtendedTrial =
    metadata.referralExtendedTrialEligible === true && !metadata.referralExtendedTrialRedeemedAt;
  const enabled = options.enabled !== false;

  return {
    enabled,
    code: activeCode || null,
    link: activeCode ? `${APP_BASE_URL}/?ref=${activeCode}` : null,
    linkStatus: activeCode ? 'active' : (metadata.referralLinkStatus || 'inactive'),
    linkClaimedAt: metadata.referralLinkClaimedAt || null,
    linkClaimedByUserId: metadata.referralLinkClaimedByUserId || null,
    extendedTrialEligible: hasExtendedTrial,
    extendedTrialRedeemedAt: metadata.referralExtendedTrialRedeemedAt || null,
    extendedTrialDays: Number(metadata.referralExtendedTrialDays) || (hasExtendedTrial ? 90 : 30),
    message: enabled
      ? null
      : 'Referral sharing is currently available for free users only.',
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasReferralStorage()) {
    return res.status(503).json({ error: 'Referral storage is not configured' });
  }

  const previewCode = sanitizeReferralCode(req.query.code);
  if (previewCode) {
    const record = await getReferralByCode(previewCode);

    if (!record) {
      return res.status(404).json({
        valid: false,
        status: 'invalid',
        message: 'This referral link is invalid.',
      });
    }

    if (record.status !== 'active') {
      return res.status(410).json({
        valid: false,
        status: 'expired',
        message: 'This referral link has expired.',
      });
    }

    return res.status(200).json({
      valid: true,
      status: 'active',
      code: previewCode,
      message: 'Referral link accepted. Sign up to unlock a 3-month Premium trial.',
    });
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const clerkUserId = (req.headers['x-clerk-userid'] || req.query.userId || '').toString().trim();

  if (!clerkSecret) {
    return res.status(500).json({ error: 'Missing CLERK_SECRET_KEY' });
  }

  if (!clerkUserId) {
    return res.status(401).json({ error: 'Missing user session' });
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const user = await clerk.users.getUser(clerkUserId);
    const metadata = user.publicMetadata || {};
    const referralEnabled =
      metadata.isPremium !== true &&
      metadata.isLifetime !== true &&
      metadata.paymentType !== 'lifetime';

    if (!referralEnabled) {
      return res.status(200).json(buildReferralPayload(user, null, { enabled: false }));
    }

    let activeCode = await getUserActiveReferralCode(clerkUserId);
    let metadataChanged = false;
    let nextMetadata = { ...metadata };

    if (activeCode && metadata.activeReferralCode !== activeCode) {
      nextMetadata.activeReferralCode = activeCode;
      nextMetadata.referralLinkStatus = 'active';
      metadataChanged = true;
    }

    if (!activeCode && metadata.referralLinkStatus !== 'claimed') {
      activeCode = await ensureReferralCodeForUser(clerkUserId);
      if (activeCode) {
        nextMetadata.activeReferralCode = activeCode;
        nextMetadata.referralLinkStatus = 'active';
        metadataChanged = true;
      }
    }

    if (!activeCode && metadata.activeReferralCode) {
      delete nextMetadata.activeReferralCode;
      metadataChanged = true;
    }

    if (metadataChanged) {
      nextMetadata.lastUpdated = new Date().toISOString();
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: pruneMetadataToBudget(nextMetadata),
      });
      return res.status(200).json(
        buildReferralPayload({ publicMetadata: nextMetadata }, activeCode, { enabled: true })
      );
    }

    return res.status(200).json(buildReferralPayload(user, activeCode, { enabled: true }));
  } catch (error) {
    console.error('Error loading referral link:', error);
    return res.status(500).json({ error: 'Failed to load referral link' });
  }
};
