const { createClerkClient } = require('@clerk/clerk-sdk-node');

const CLERK_BATCH_LIMIT = 100;
const ACTIVE_DAYS_DEFAULT = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

  const activityWindowDays = ACTIVE_DAYS_DEFAULT;
  const activeSince = new Date(Date.now() - activityWindowDays * MS_PER_DAY);

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const allUsers = await getAllUsers(clerk);

  const leaderboardCandidates = allUsers.map((user) => {
    const email = user.emailAddresses[0]?.emailAddress || 'Unknown';
    const username = user.username || email.split('@')[0];
    const totalFocusHours = toNumber(user.publicMetadata?.totalFocusHours);
    const statsLastUpdated = parseDate(user.publicMetadata?.statsLastUpdated);
    const lastActiveFallback =
      parseDate(user.lastActiveAt) ||
      parseDate(user.lastSignInAt) ||
      parseDate(user.createdAt);
    const lastActiveAt = statsLastUpdated || lastActiveFallback;
    const isActive = lastActiveAt ? lastActiveAt >= activeSince : false;
    const isPremium = user.publicMetadata?.isPremium === true;

    return {
      userId: user.id,
      username,
      email,
      totalFocusHours,
      isPremium,
      lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
      isActive,
    };
  });

  const sortedLeaderboard = leaderboardCandidates
    .filter(
      (user) => user.totalFocusHours > 0 && (user.isPremium === true || user.isActive)
    )
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
    activityWindowDays,
    rankBaselineVersion,
    leaderboard: sortedLeaderboard,
  };
};

module.exports = {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
};
