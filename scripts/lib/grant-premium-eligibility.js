const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Best signal that the user actually used Superfocus (timer / sync). */
function getLastProductActivity(user) {
  const meta = user.publicMetadata || {};
  const candidates = [
    parseDate(meta.statsLastUpdated),
    parseDate(user.lastActiveAt),
    parseDate(user.lastSignInAt),
  ].filter(Boolean);

  if (!candidates.length) return null;
  return candidates.reduce((latest, d) => (d > latest ? d : latest), candidates[0]);
}

function classifyGrantEligibility(user, activeSince) {
  const meta = user.publicMetadata || {};

  if (meta.isPremium === true) {
    return { eligible: false, reason: 'already_premium' };
  }
  if (meta.isLifetime === true) {
    return { eligible: false, reason: 'lifetime' };
  }
  if (meta.legacyFreeGrant === true) {
    return { eligible: false, reason: 'already_granted' };
  }

  const lastActivity = getLastProductActivity(user);
  if (!lastActivity || lastActivity < activeSince) {
    return {
      eligible: false,
      reason: lastActivity ? 'inactive' : 'no_activity_signal',
      lastActivityAt: lastActivity ? lastActivity.toISOString() : null,
    };
  }

  return {
    eligible: true,
    reason: 'active_free_user',
    lastActivityAt: lastActivity.toISOString(),
  };
}

function buildComplimentaryMetadata(existingMetadata = {}) {
  const now = new Date().toISOString();
  return {
    ...existingMetadata,
    isPremium: true,
    paymentType: 'complimentary',
    legacyFreeGrant: true,
    premiumSince: existingMetadata.premiumSince || now,
    upgradedBy: 'no-free-plan-migration',
    lastUpdated: now,
  };
}

module.exports = {
  MS_PER_DAY,
  parseDate,
  getLastProductActivity,
  classifyGrantEligibility,
  buildComplimentaryMetadata,
};
