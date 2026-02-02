const { createClerkClient } = require('@clerk/clerk-sdk-node');

const CLERK_BATCH_LIMIT = 100;

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPremiumUsers = async (clerk) => {
  let premiumUsers = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await clerk.users.getUserList({
      limit: CLERK_BATCH_LIMIT,
      offset,
    });

    const premiumBatch = (response.data || []).filter(
      (user) => user.publicMetadata?.isPremium === true
    );
    premiumUsers = premiumUsers.concat(premiumBatch);

    hasMore = response.data.length === CLERK_BATCH_LIMIT;
    offset += CLERK_BATCH_LIMIT;
  }

  return premiumUsers;
};

const buildPreviousRanks = (leaderboard = []) =>
  leaderboard.reduce((acc, user, index) => {
    acc[user.userId] = index + 1;
    return acc;
  }, {});

const buildPremiumLeaderboardSnapshot = async ({ previousRanks = {}, clerkSecretKey }) => {
  if (!clerkSecretKey) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const premiumUsers = await getPremiumUsers(clerk);

  const leaderboardCandidates = premiumUsers.map((user) => {
    const email = user.emailAddresses[0]?.emailAddress || 'Unknown';
    const username = user.username || email.split('@')[0];
    const totalFocusHours = toNumber(user.publicMetadata?.totalFocusHours);

    return {
      userId: user.id,
      username,
      email,
      totalFocusHours,
      isPremium: true,
    };
  });

  const sortedLeaderboard = leaderboardCandidates
    .filter((user) => user.totalFocusHours > 0)
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
    leaderboard: sortedLeaderboard,
  };
};

module.exports = {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
};
