// Public endpoint to get user photos for social proof section
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Cache for 24 hours
let cachedUsers = null;
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
  if (cachedUsers && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return res.status(200).json({
      success: true,
      users: cachedUsers,
      cached: true,
      lastUpdated: new Date(cacheTimestamp).toISOString()
    });
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get users with pagination (limit to first 500 for performance)
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    const maxUsers = 500; // Limit to first 500 users for performance

    while (hasMore && allUsers.length < maxUsers) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      // Filter users that have profile images
      const usersWithImages = response.data
        .filter(user => user.imageUrl)
        .map(user => ({
          id: user.id,
          imageUrl: user.imageUrl,
          firstName: user.firstName,
          lastName: user.lastName
        }));

      allUsers = allUsers.concat(usersWithImages);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    // Shuffle and take first 8-12 users for display
    const shuffled = allUsers.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 12);

    // Update cache
    cachedUsers = selectedUsers;
    cacheTimestamp = now;

    res.status(200).json({
      success: true,
      users: selectedUsers,
      cached: false,
      lastUpdated: new Date(now).toISOString()
    });

  } catch (error) {
    console.error('Error fetching user photos:', error);
    
    // If we have cached data, return it even if expired
    if (cachedUsers) {
      return res.status(200).json({
        success: true,
        users: cachedUsers,
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
