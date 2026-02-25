const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { runCassetteMetadataCleanup } = require('../lib/cassette-metadata-cleanup');

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
}

function parsePositiveInt(value, fallback, max = 5000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    return res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
  }

  try {
    const params = req.method === 'GET' ? req.query || {} : req.body || {};
    const defaultDryRun = req.method === 'POST';
    const dryRun = parseBoolean(params.dryRun, defaultDryRun);
    const maxUsersFromEnv = parsePositiveInt(process.env.CASSETTE_CLEANUP_MAX_USERS_PER_RUN, 1000, 10000);
    const maxUsers = parsePositiveInt(params.maxUsers, maxUsersFromEnv, 10000);
    const startOffset = parsePositiveInt(params.startOffset, 0, 1000000);

    const clerk = createClerkClient({ secretKey: clerkSecret });
    const summary = await runCassetteMetadataCleanup({
      clerk,
      dryRun,
      maxUsers,
      startOffset,
    });

    return res.status(200).json({
      success: true,
      mode: dryRun ? 'dry-run' : 'apply',
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron cassette metadata cleanup error:', error);
    return res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
};

