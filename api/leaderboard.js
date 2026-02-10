// API endpoint to get leaderboard snapshot:
// - Free users active in last N days
// - Premium users always included
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { buildPremiumLeaderboardSnapshot } = require('./leaderboard-premium-service');
const { getSnapshot, setSnapshot } = require('./leaderboard-cache');
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;
const DEFAULT_ACTIVE_DAYS = 7;

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkUserId = req.headers['x-clerk-userid'];
  
  // Get pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit, 10);
  const itemsPerPage =
    Number.isFinite(limit) && limit > 0
      ? Math.min(limit, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  try {
    let snapshot = await getSnapshot();

    if (!snapshot) {
      snapshot = await buildPremiumLeaderboardSnapshot({
        previousRanks: {},
        clerkSecretKey: process.env.CLERK_SECRET_KEY,
      });

      await setSnapshot(snapshot);
    }

    const allLeaderboardUsers = snapshot.leaderboard || [];
    const totalUsers = snapshot.totalUsers ?? allLeaderboardUsers.length;
    const activityWindowDays = snapshot.activityWindowDays || DEFAULT_ACTIVE_DAYS;
    const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / itemsPerPage) : 1;
    const safePage = totalPages > 0 ? Math.max(1, Math.min(page, totalPages)) : 1;
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const leaderboard = allLeaderboardUsers
      .slice(startIndex, endIndex)
      .map((user) => ({
        ...user,
        isCurrentUser: clerkUserId ? user.userId === clerkUserId : false,
      }));

    let currentUserPosition = null;
    let nextRankGapMinutes = null;
    let nextRankTargetRank = null;

    if (clerkUserId) {
      let index = allLeaderboardUsers.findIndex(
        (user) => user.userId === clerkUserId
      );

      // If user is not in the filtered list, compute their projected rank anyway.
      if (index === -1 && process.env.CLERK_SECRET_KEY) {
        try {
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
          const currentClerkUser = await clerk.users.getUser(clerkUserId);
          const currentUserHours = toNumber(currentClerkUser?.publicMetadata?.totalFocusHours);

          // Build combined list: displayed users + current user, sort by totalFocusHours desc
          const combined = [
            ...allLeaderboardUsers.map((u) => ({ userId: u.userId, totalFocusHours: u.totalFocusHours })),
            { userId: clerkUserId, totalFocusHours: currentUserHours },
          ].sort((a, b) => b.totalFocusHours - a.totalFocusHours);

          const combinedIndex = combined.findIndex((u) => u.userId === clerkUserId);
          if (combinedIndex !== -1) {
            currentUserPosition = combinedIndex + 1;
            if (combinedIndex > 0) {
              const nextUser = combined[combinedIndex - 1];
              const gapHours = nextUser.totalFocusHours - currentUserHours;
              const gapMinutes = Math.ceil(gapHours * 60);
              if (gapMinutes > 0) {
                nextRankGapMinutes = gapMinutes;
                nextRankTargetRank = combinedIndex;
              }
            }
          }
        } catch (err) {
          console.warn('Leaderboard: could not get current user rank for free user', err.message);
        }
      } else if (index !== -1) {
        currentUserPosition = index + 1;

        if (index > 0) {
          const currentUser = allLeaderboardUsers[index];
          const nextUser = allLeaderboardUsers[index - 1];
          const gapHours = nextUser.totalFocusHours - currentUser.totalFocusHours;
          const gapMinutes = Math.ceil(gapHours * 60);

          if (gapMinutes > 0) {
            nextRankGapMinutes = gapMinutes;
            nextRankTargetRank = index;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      leaderboard,
      currentUserPosition,
      nextRankGapMinutes,
      nextRankTargetRank,
      totalUsers,
      page: safePage,
      totalPages,
      hasMore: safePage < totalPages,
      pageSize: itemsPerPage,
      activityWindowDays,
      updatedAt: snapshot.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
};

