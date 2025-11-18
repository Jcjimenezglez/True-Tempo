// Public endpoint to get total user count (cached for 24 hours)
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// In-memory cache (will reset on serverless function restart, but that's okay)
let cachedStats = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  // Check if we have valid cached data
  const now = Date.now();
  if (cachedStats && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return res.status(200).json({
      success: true,
      totalUsers: cachedStats.totalUsers,
      roundedTotalUsers: cachedStats.roundedTotalUsers,
      cached: true,
      lastUpdated: new Date(cacheTimestamp).toISOString()
    });
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get all users with pagination
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    const totalUsers = allUsers.length;
    
    // Round to nearest 50 for display (e.g., 908 -> 900, 925 -> 950)
    const roundedTotalUsers = Math.round(totalUsers / 50) * 50;

    // Update cache
    cachedStats = {
      totalUsers,
      roundedTotalUsers
    };
    cacheTimestamp = now;

    res.status(200).json({
      success: true,
      totalUsers,
      roundedTotalUsers,
      cached: false,
      lastUpdated: new Date(now).toISOString()
    });

  } catch (error) {
    console.error('Error fetching public stats:', error);
    
    // If we have cached data, return it even if expired
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        totalUsers: cachedStats.totalUsers,
        roundedTotalUsers: cachedStats.roundedTotalUsers,
        cached: true,
        error: 'Using cached data due to fetch error',
        lastUpdated: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

