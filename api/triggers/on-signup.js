// api/triggers/on-signup.js
// This endpoint should be called when a user signs up
// You can call it from Clerk webhook or from your frontend after signup

const { sendEmail } = require('../email/send-email');
const templates = require('../email/templates');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { pruneMetadataToBudget } = require('../lib/clerk-metadata-utils');
const { claimReferralCode, sanitizeReferralCode } = require('../lib/referrals');

async function updateUserMetadata(clerk, userId, updater) {
  const user = await clerk.users.getUser(userId);
  const nextMetadata = pruneMetadataToBudget(updater({ ...(user.publicMetadata || {}) }));

  await clerk.users.updateUser(userId, {
    publicMetadata: nextMetadata,
  });

  return user;
}

async function claimReferralReward(clerk, userId, referralCode) {
  const sanitizedCode = sanitizeReferralCode(referralCode);
  if (!userId || !sanitizedCode) {
    return { status: 'skipped' };
  }

  const referredUser = await clerk.users.getUser(userId);
  const referredMetadata = referredUser.publicMetadata || {};

  if (referredMetadata.referredByUserId || referredMetadata.referralRewardUnlockedAt) {
    return {
      status: 'already_used',
      message: 'This account already has a referral reward.',
    };
  }

  const claimResult = await claimReferralCode(sanitizedCode, userId);

  if (claimResult.status === 'self') {
    return {
      status: 'self_referral',
      message: 'You cannot use your own referral link.',
    };
  }

  if (claimResult.status === 'expired') {
    return {
      status: 'expired',
      message: 'This referral link has expired.',
    };
  }

  if (claimResult.status !== 'accepted' || !claimResult.ownerUserId) {
    return {
      status: 'invalid',
      message: 'This referral link is invalid.',
    };
  }

  const unlockedAt = claimResult.claimedAt || new Date().toISOString();
  const ownerUserId = claimResult.ownerUserId;

  await updateUserMetadata(clerk, userId, (metadata) => ({
    ...metadata,
    referredByUserId: ownerUserId,
    referralAcceptedCode: sanitizedCode,
    referralRewardUnlockedAt: unlockedAt,
    referralExtendedTrialEligible: true,
    referralExtendedTrialDays: 90,
    referralLinkStatus: metadata.referralLinkStatus || 'inactive',
    lastUpdated: unlockedAt,
  }));

  await updateUserMetadata(clerk, ownerUserId, (metadata) => {
    const next = {
      ...metadata,
      referralRewardUnlockedAt: unlockedAt,
      referralExtendedTrialEligible: true,
      referralExtendedTrialDays: 90,
      referralLinkStatus: 'claimed',
      referralLinkClaimedAt: unlockedAt,
      referralLinkClaimedByUserId: userId,
      lastUpdated: unlockedAt,
    };

    delete next.activeReferralCode;
    return next;
  });

  return {
    status: 'claimed',
    ownerUserId,
    message: 'Referral unlocked. You can now start a 3-month Premium trial.',
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, referralCode } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    // Get user info from Clerk if userId provided
    let userEmail = email;
    let firstName = 'there';

    let referralResult = { status: 'skipped' };

    if (userId) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerk.users.getUser(userId);
        userEmail = user.emailAddresses?.[0]?.emailAddress || email;
        firstName = user.firstName || user.username || 'there';
        referralResult = await claimReferralReward(clerk, userId, referralCode);
      } catch (error) {
        console.error('Error fetching user from Clerk:', error);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Could not determine user email' });
    }

    // Send welcome email immediately
    const welcomeTemplate = templates.getWelcomeEmailTemplate({ firstName });
    const welcomeResult = await sendEmail({
      to: userEmail,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
      tags: ['signup_welcome'],
    });

    // Follow-up emails disabled; welcome email only.
    if (userId) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        await updateUserMetadata(clerk, userId, (metadata) => ({
          ...metadata,
          scheduledEmails: {},
        }));
      } catch (error) {
        console.error('Error clearing scheduled emails:', error);
        // Don't fail the request if cleanup fails
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Signup email sequence started',
      welcomeEmailSent: welcomeResult.success,
      referral: referralResult,
    });

  } catch (error) {
    console.error('Error in on-signup trigger:', error);
    return res.status(500).json({ error: error.message });
  }
};

