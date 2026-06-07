const MIN_FOCUS_FOR_DISPLAY = 1 / 60; // 1 minute — below this shows as 0h 0m

function isLegacyComplimentaryMember(meta = {}) {
  return meta.legacyFreeGrant === true;
}

function isPayingPremiumMember(meta = {}) {
  if (meta.isPremium !== true) return false;
  if (isLegacyComplimentaryMember(meta)) return false;
  if (meta.paymentType === 'complimentary') return false;
  return true;
}

function isLeaderboardEligible(meta = {}, totalFocusHours = 0) {
  const hours = typeof totalFocusHours === 'number' ? totalFocusHours : 0;
  if (hours < MIN_FOCUS_FOR_DISPLAY) return false;
  return isLegacyComplimentaryMember(meta) || isPayingPremiumMember(meta);
}

function getLeaderboardMemberType(meta = {}) {
  if (isLegacyComplimentaryMember(meta)) return 'legacy_complimentary';
  if (isPayingPremiumMember(meta)) return 'paying_premium';
  return null;
}

module.exports = {
  MIN_FOCUS_FOR_DISPLAY,
  isLegacyComplimentaryMember,
  isPayingPremiumMember,
  isLeaderboardEligible,
  getLeaderboardMemberType,
};
