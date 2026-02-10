const { createClerkClient } = require('@clerk/clerk-sdk-node');
const {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
} = require('./leaderboard-premium-service');
const {
  getSnapshot,
  setSnapshot,
  isCacheConfigured,
} = require('./leaderboard-cache');
const LEADERBOARD_RANK_BASELINE_VERSION = '2026-02-10-reset';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clerkKey = process.env.CLERK_SECRET_KEY;
  if (!clerkKey) {
    return res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
  }

  const userId = req.headers['x-clerk-userid'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkKey });
    await clerk.users.getUser(userId);

    if (!isCacheConfigured()) {
      return res.status(500).json({
        error: 'Cache not configured',
        details: 'Missing KV_REST_API_URL/KV_REST_API_TOKEN or REDIS_URL',
      });
    }

    const previousSnapshot = await getSnapshot();
    const shouldResetBaseline =
      !previousSnapshot ||
      previousSnapshot.rankBaselineVersion !== LEADERBOARD_RANK_BASELINE_VERSION;
    const previousRanks = shouldResetBaseline
      ? {}
      : buildPreviousRanks(previousSnapshot?.leaderboard || []);

    const snapshot = await buildPremiumLeaderboardSnapshot({
      previousRanks,
      clerkSecretKey: clerkKey,
      rankBaselineVersion: LEADERBOARD_RANK_BASELINE_VERSION,
    });

    await setSnapshot(snapshot);

    return res.status(200).json({
      success: true,
      totalUsers: snapshot.totalUsers,
      updatedAt: snapshot.updatedAt,
    });
  } catch (error) {
    console.error('Leaderboard refresh error:', error);
    return res.status(500).json({ error: error.message || 'Refresh failed' });
  }
};
