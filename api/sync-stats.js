// API endpoint to sync user statistics to Clerk
const { createClerkClient } = require('@clerk/clerk-sdk-node');

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

    // Build new metadata - preserve existing data and update with new
    const newMeta = {
      ...currentMeta,
      totalFocusHours: totalHours,
      statsLastUpdated: new Date().toISOString()
    };

    // Store extended stats if provided (for full data backup)
    if (focusStats && typeof focusStats === 'object') {
      // Only store essential daily data to avoid hitting Clerk metadata limits
      // Keep last 90 days of daily data
      const now = Date.now();
      const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
      
      const trimmedDaily = {};
      const trimmedDailySessions = {};
      const trimmedDailyBreaks = {};
      
      if (focusStats.daily) {
        Object.entries(focusStats.daily).forEach(([date, hours]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > ninetyDaysAgo) {
            trimmedDaily[date] = hours;
          }
        });
      }
      
      if (focusStats.dailySessions) {
        Object.entries(focusStats.dailySessions).forEach(([date, sessions]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > ninetyDaysAgo) {
            trimmedDailySessions[date] = sessions;
          }
        });
      }
      
      if (focusStats.dailyBreaks) {
        Object.entries(focusStats.dailyBreaks).forEach(([date, breaks]) => {
          const dateTime = new Date(date).getTime();
          if (dateTime > ninetyDaysAgo) {
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
      newMeta.customTechniques = customTechniques;
    }

    // Store private cassettes if provided (public cassettes handled by sync-cassettes)
    if (customCassettes && Array.isArray(customCassettes)) {
      // Filter to only private cassettes (public ones are handled separately)
      const privateCassettes = customCassettes.filter(c => !c.isPublic);
      newMeta.privateCassettes = privateCassettes;
    }

    // Store streak data if provided
    if (streakData && typeof streakData === 'object') {
      newMeta.streakData = streakData;
    }

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: newMeta
    });

    res.status(200).json({
      success: true,
      totalFocusHours: totalHours,
      hasBackup: !!focusStats,
      hasTechniques: !!(customTechniques && customTechniques.length > 0),
      hasCassettes: !!(customCassettes && customCassettes.length > 0)
    });
  } catch (error) {
    console.error('Error syncing stats:', error);
    res.status(500).json({ error: 'Failed to sync stats', details: error.message });
  }
};

