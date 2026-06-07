const { createClerkClient } = require('@clerk/clerk-sdk-node');
const {
  isLeaderboardEligible,
  isLegacyComplimentaryMember,
  isPayingPremiumMember,
} = require('./lib/leaderboard-eligibility');

const CLERK_BATCH_LIMIT = 100;

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAllUsers = async (clerk) => {
  let users = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await clerk.users.getUserList({
      limit: CLERK_BATCH_LIMIT,
      offset,
    });

    users = users.concat(response.data || []);

    hasMore = response.data.length === CLERK_BATCH_LIMIT;
    offset += CLERK_BATCH_LIMIT;
  }

  return users;
};

const buildPreviousRanks = (leaderboard = []) =>
  leaderboard.reduce((acc, user, index) => {
    acc[user.userId] = index + 1;
    return acc;
  }, {});

const buildPremiumLeaderboardSnapshot = async ({
  previousRanks = {},
  clerkSecretKey,
  rankBaselineVersion = null,
}) => {
  if (!clerkSecretKey) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const allUsers = await getAllUsers(clerk);

  const sortedLeaderboard = allUsers
    .map((user) => {
      const meta = user.publicMetadata || {};
      const email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      const username = user.username || email.split('@')[0];
      const totalFocusHours = toNumber(meta.totalFocusHours);
      const legacyComplimentary = isLegacyComplimentaryMember(meta);
      const payingPremium = isPayingPremiumMember(meta);

      return {
        userId: user.id,
        username,
        email,
        totalFocusHours,
        isPremium: legacyComplimentary || payingPremium,
        isLegacyComplimentary: legacyComplimentary,
        isPayingPremium: payingPremium,
        eligible: isLeaderboardEligible(meta, totalFocusHours),
      };
    })
    .filter((user) => user.eligible)
    .map(({ eligible, ...user }) => user)
    .sort((a, b) => b.totalFocusHours - a.totalFocusHours)
    .map((user, index) => {
      const rank = index + 1;
      const previousRank = previousRanks[user.userId];
      const rankChange =
        typeof previousRank === 'number' ? previousRank - rank : 0;

      return {
        ...user,
        rankChange,
      };
    });

  return {
    updatedAt: new Date().toISOString(),
    totalUsers: sortedLeaderboard.length,
    rankBaselineVersion,
    leaderboard: sortedLeaderboard,
  };
};

module.exports = {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
};
