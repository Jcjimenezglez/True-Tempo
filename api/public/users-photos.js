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
    
    // Get users with pagination (fetch more to filter better and avoid children)
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    const maxUsers = 2000; // Fetch more users to have better filtering options and avoid children

    while (hasMore && allUsers.length < maxUsers) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      // Filter users that have real profile images (not placeholders, initials, or generic icons)
      // In Clerk: if user has imageUrl, it's a real uploaded photo
      // If no imageUrl, Clerk shows initials with colored backgrounds (we exclude those)
      // We also exclude users with very generic/default image URLs
      const usersWithImages = response.data
        .filter(user => {
          // Must have imageUrl - this means they uploaded a real photo
          // Users without imageUrl show initials/letters with colored backgrounds (excluded)
          if (!user.imageUrl) return false;
          
          // Exclude if imageUrl looks like a placeholder, default, or generic icon
          const imageUrl = user.imageUrl.toLowerCase();
          const excludedPatterns = [
            'placeholder',
            'default',
            'avatar-placeholder',
            'avatar-default',
            'generic',
            'icon',
            'silhouette',
            'profile-icon'
          ];
          
          if (excludedPatterns.some(pattern => imageUrl.includes(pattern))) {
            return false;
          }
          
          // Clerk imageUrl for real photos typically contains img.clerk.com or similar CDN
          // If it doesn't look like a Clerk CDN URL, might be suspicious
          if (!imageUrl.includes('clerk') && !imageUrl.includes('http')) {
            return false;
          }
          
          return true;
        })
        .map(user => ({
          id: user.id,
          imageUrl: user.imageUrl,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          emailAddress: user.emailAddresses?.[0]?.emailAddress
        }));

      allUsers = allUsers.concat(usersWithImages);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    // Filter out potential children by checking account age (accounts created very recently might be test accounts)
    // Also prioritize accounts that are at least a few days old
    const now = Date.now();
    const filteredUsers = allUsers.filter(user => {
      if (user.createdAt) {
        const accountAge = now - new Date(user.createdAt).getTime();
        const minAge = 7 * 24 * 60 * 60 * 1000; // At least 7 days old
        return accountAge >= minAge;
      }
      return true; // Keep if no createdAt info
    });

    // Shuffle and take first 5 users for display (prioritize older accounts)
    // Fetch more to have better selection and avoid children/placeholders
    const shuffled = filteredUsers.length > 0 
      ? filteredUsers.sort(() => 0.5 - Math.random())
      : allUsers.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 5);

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
