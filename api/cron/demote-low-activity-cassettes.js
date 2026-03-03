// Cron: demote public cassettes with low views to private
// Cassettes with < minViews stay private until the creator manually sets them back to public
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const {
  isMetadataLimitError,
  pruneMetadataToBudget,
  sanitizeCassetteArray,
} = require('../lib/clerk-metadata-utils');

const DEFAULT_MIN_VIEWS = 10;
const BATCH_LIMIT = 100;

function parsePositiveInt(value, fallback, max = 10000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
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
    const minViews = parsePositiveInt(
      process.env.CASSETTE_DEMOTE_MIN_VIEWS || params.minViews,
      DEFAULT_MIN_VIEWS,
      1000
    );
    const maxUsers = parsePositiveInt(params.maxUsers, 5000, 10000);
    const startOffset = parsePositiveInt(params.startOffset, 0, 1000000);

    const clerk = createClerkClient({ secretKey: clerkSecret });

    let allUsers = [];
    let hasMore = true;
    let offset = startOffset;

    while (hasMore && allUsers.length < maxUsers) {
      const response = await clerk.users.getUserList({
        limit: BATCH_LIMIT,
        offset,
      });
      allUsers = allUsers.concat(response.data || []);
      hasMore = response.data?.length === BATCH_LIMIT;
      offset += BATCH_LIMIT;
    }

    const summary = {
      totalUsersScanned: allUsers.length,
      usersUpdated: 0,
      cassettesDemoted: 0,
      demoted: [],
      errors: [],
    };

    for (const user of allUsers) {
      try {
        const publicCassettes = user.publicMetadata?.publicCassettes || [];
        if (!Array.isArray(publicCassettes) || publicCassettes.length === 0) continue;

        const toDemote = publicCassettes.filter(
          (c) =>
            c &&
            c.isPublic === true &&
            c.id &&
            (Number(c.views) || 0) < minViews
        );

        if (toDemote.length === 0) continue;

        const updatedPublicCassettes = publicCassettes.map((cassette) => {
          const shouldDemote = toDemote.some((d) => d.id === cassette.id);
          if (shouldDemote) {
            summary.cassettesDemoted++;
            summary.demoted.push({
              cassetteId: cassette.id,
              title: cassette.title || cassette.id,
              views: Number(cassette.views) || 0,
              userId: user.id,
            });
            return { ...cassette, isPublic: false };
          }
          return cassette;
        });

        if (!dryRun) {
          const currentMeta = user.publicMetadata || {};
          const candidateMeta = {
            ...currentMeta,
            publicCassettes: sanitizeCassetteArray(updatedPublicCassettes, { maxCount: 200 }),
          };
          const newMeta = pruneMetadataToBudget(candidateMeta);

          try {
            await clerk.users.updateUser(user.id, { publicMetadata: newMeta });
          } catch (err) {
            if (isMetadataLimitError(err)) {
              const fallbackMeta = pruneMetadataToBudget(
                {
                  ...currentMeta,
                  publicCassettes: sanitizeCassetteArray(updatedPublicCassettes, {
                    minimal: true,
                    maxCount: 40,
                  }),
                },
                6000
              );
              await clerk.users.updateUser(user.id, { publicMetadata: fallbackMeta });
            } else {
              throw err;
            }
          }
          summary.usersUpdated++;
        }
      } catch (err) {
        summary.errors.push({
          userId: user.id,
          error: err.message || String(err),
        });
      }
    }

    return res.status(200).json({
      success: true,
      mode: dryRun ? 'dry-run' : 'apply',
      minViews,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron demote low-activity cassettes error:', error);
    return res.status(500).json({
      error: 'Demote failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
