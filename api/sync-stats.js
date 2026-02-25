// API endpoint to sync user statistics to Clerk
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const {
  getMetadataSizeBytes,
  isMetadataLimitError,
  pruneMetadataToBudget,
  sanitizeCassetteArray,
} = require('./lib/clerk-metadata-utils');

// Server-side rate limit cooldown (persists in warm function instances)
const _userCooldowns = new Map();
const COOLDOWN_MS = 15000; // 15 seconds between calls per user

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  const clerkUserId = req.headers['x-clerk-userid'];
  if (!clerkUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Server-side per-user throttle
  const now = Date.now();
  const lastCall = _userCooldowns.get(clerkUserId) || 0;
  if (now - lastCall < COOLDOWN_MS) {
    res.status(429).json({ error: 'Too frequent', retryAfter: Math.ceil((COOLDOWN_MS - (now - lastCall)) / 1000) });
    return;
  }
  _userCooldowns.set(clerkUserId, now);

  // Clean up old entries to prevent memory leaks
  if (_userCooldowns.size > 1000) {
    for (const [uid, ts] of _userCooldowns) {
      if (now - ts > 60000) _userCooldowns.delete(uid);
    }
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const { 
      totalHours, 
      // Extended stats data (optional)
      focusStats,
      customTechniques,
      customCassettes,
      streakData
    } = req.body;

    if (typeof totalHours !== 'number' || totalHours < 0) {
      res.status(400).json({ error: 'Invalid totalHours' });
      return;
    }

    // Get current user metadata
    const user = await clerk.users.getUser(clerkUserId);
    const currentMeta = user.publicMetadata || {};
    const baseMeta = { ...currentMeta };

    // Always sanitize cassette arrays from existing metadata to remove legacy viewedBy payload.
    if (Array.isArray(baseMeta.publicCassettes)) {
      baseMeta.publicCassettes = sanitizeCassetteArray(baseMeta.publicCassettes, { maxCount: 200 });
    }
    if (Array.isArray(baseMeta.privateCassettes)) {
      baseMeta.privateCassettes = sanitizeCassetteArray(baseMeta.privateCassettes, { maxCount: 50 });
    }

    // Build new metadata - preserve existing data and update with new
    const newMeta = {
      ...baseMeta,
      totalFocusHours: totalHours,
      statsLastUpdated: new Date().toISOString(),
    };

    // Store extended stats if provided (for full data backup)
    if (focusStats && typeof focusStats === 'object') {
      // Only store essential daily data to avoid hitting Clerk metadata limits
      // Keep last 45 days of daily data for better safety margin under Clerk metadata limits.
      const backupNow = Date.now();
      const fortyFiveDaysAgo = backupNow - (45 * 24 * 60 * 60 * 1000);
      
      const trimmedDaily = {};
      const trimmedDailySessions = {};
      const trimmedDailyBreaks = {};
      
      if (focusStats.daily) {
        Object.entries(focusStats.daily).forEach(([date, hours]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > fortyFiveDaysAgo) {
            trimmedDaily[date] = hours;
          }
        });
      }
      
      if (focusStats.dailySessions) {
        Object.entries(focusStats.dailySessions).forEach(([date, sessions]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > fortyFiveDaysAgo) {
            trimmedDailySessions[date] = sessions;
          }
        });
      }
      
      if (focusStats.dailyBreaks) {
        Object.entries(focusStats.dailyBreaks).forEach(([date, breaks]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > fortyFiveDaysAgo) {
            trimmedDailyBreaks[date] = breaks;
          }
        });
      }
      
      newMeta.focusStatsBackup = {
        totalHours: focusStats.totalHours,
        completedCycles: focusStats.completedCycles,
        daily: trimmedDaily,
        dailySessions: trimmedDailySessions,
        dailyBreaks: trimmedDailyBreaks,
        lastBackup: new Date().toISOString()
      };
    }

    // Store custom techniques if provided
    if (customTechniques && Array.isArray(customTechniques)) {
      newMeta.customTechniques = customTechniques.slice(-50);
    }

    // Store private cassettes if provided (public cassettes handled by sync-cassettes)
    if (customCassettes && Array.isArray(customCassettes)) {
      // Filter to only private cassettes (public ones are handled separately)
      const privateCassettes = customCassettes.filter((c) => c && !c.isPublic);
      newMeta.privateCassettes = sanitizeCassetteArray(privateCassettes, { maxCount: 50 });
    }

    // Store streak data if provided
    if (streakData && typeof streakData === 'object') {
      newMeta.streakData = streakData;
    }

    let metadataToPersist = pruneMetadataToBudget(newMeta);
    let degraded = false;

    try {
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: metadataToPersist,
      });
    } catch (error) {
      if (!isMetadataLimitError(error)) {
        throw error;
      }

      // Fallback: persist only critical fields while preserving premium/payment state.
      degraded = true;
      metadataToPersist = pruneMetadataToBudget(
        {
          ...baseMeta,
          totalFocusHours: totalHours,
          statsLastUpdated: new Date().toISOString(),
        },
        5000
      );

      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: metadataToPersist,
      });
    }

    res.status(200).json({
      success: true,
      totalFocusHours: totalHours,
      hasBackup: !!focusStats,
      hasTechniques: !!(customTechniques && customTechniques.length > 0),
      hasCassettes: !!(customCassettes && customCassettes.length > 0),
      degraded: degraded,
      metadataBytes: getMetadataSizeBytes(metadataToPersist),
    });
  } catch (error) {
    if (error.status === 429 || error.code === 'api_response_error' && error.message?.includes('Too Many')) {
      console.warn('Clerk rate limit hit in sync-stats');
      res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
      return;
    }
    if (isMetadataLimitError(error)) {
      res.status(422).json({
        error: 'Metadata too large for Clerk',
        details: 'public_metadata exceeds the maximum allowed size of 8192 bytes',
      });
      return;
    }
    console.error('Error syncing stats:', error);
    res.status(500).json({ error: 'Failed to sync stats', details: error.message });
  }
};

