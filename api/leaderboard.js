// API endpoint to get premium-only leaderboard snapshot
const { kv } = require('@vercel/kv');
const { buildPremiumLeaderboardSnapshot } = require('./leaderboard-premium-service');

const LEADERBOARD_KV_KEY = 'leaderboard:premium:current';
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;

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
    let snapshot = await kv.get(LEADERBOARD_KV_KEY);
    if (!snapshot) {
      snapshot = await buildPremiumLeaderboardSnapshot({
        previousRanks: {},
        clerkSecretKey: process.env.CLERK_SECRET_KEY,
      });
      await kv.set(LEADERBOARD_KV_KEY, snapshot);
    }

    const allLeaderboardUsers = (snapshot.leaderboard || []).filter(
      (user) => user.isPremium === true
    );
    const totalUsers = allLeaderboardUsers.length;
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
      const index = allLeaderboardUsers.findIndex(
        (user) => user.userId === clerkUserId
      );
      if (index !== -1) {
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
      updatedAt: snapshot.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
};

