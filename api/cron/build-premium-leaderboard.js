const { kv } = require('@vercel/kv');
const {
  buildPremiumLeaderboardSnapshot,
  buildPreviousRanks,
} = require('../leaderboard-premium-service');

const LEADERBOARD_KV_KEY = 'leaderboard:premium:current';

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(500).json({
        error: 'KV not configured',
        details: 'Missing KV_REST_API_URL or KV_REST_API_TOKEN',
      });
    }

    const previousSnapshot = await kv.get(LEADERBOARD_KV_KEY);
    const previousRanks = buildPreviousRanks(previousSnapshot?.leaderboard || []);

    const snapshot = await buildPremiumLeaderboardSnapshot({
      previousRanks,
      clerkSecretKey: process.env.CLERK_SECRET_KEY,
    });

    await kv.set(LEADERBOARD_KV_KEY, snapshot);

    return res.status(200).json({
      success: true,
      totalUsers: snapshot.totalUsers,
      updatedAt: snapshot.updatedAt,
    });
  } catch (error) {
    console.error('Error building premium leaderboard snapshot:', error);
    return res.status(500).json({ error: error.message });
  }
};
