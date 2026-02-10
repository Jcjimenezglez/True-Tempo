const {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
} = require('../leaderboard-premium-service');
const {
  getSnapshot,
  setSnapshot,
  isCacheConfigured,
} = require('../leaderboard-cache');
const LEADERBOARD_RANK_BASELINE_VERSION = '2026-02-10-reset';

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
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
      clerkSecretKey: process.env.CLERK_SECRET_KEY,
      rankBaselineVersion: LEADERBOARD_RANK_BASELINE_VERSION,
    });

    await setSnapshot(snapshot);

    return res.status(200).json({
      success: true,
      totalUsers: snapshot.totalUsers,
      updatedAt: snapshot.updatedAt,
    });
  } catch (error) {
    console.error('Error building leaderboard snapshot:', error);
    return res.status(500).json({ error: error.message });
  }
};
