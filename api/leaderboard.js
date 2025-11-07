// API endpoint to get leaderboard of Total Focus Hours
const { createClerkClient } = require('@clerk/clerk-sdk-node');

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

  const clerkUserId = req.headers['x-clerk-userid'];
  
  // Get pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const itemsPerPage = 100; // Fixed items per page

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // For page 1, we can optimize by only loading enough users to get top 100
    // For pages > 1, we need to load all users to properly sort and paginate
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const clerkLimit = 100;

    if (page === 1) {
      // For page 1, load users in batches until we have enough users with hours
      // We need to load enough to ensure we have at least 100 users with hours
      // But we can stop early if we have enough
      let usersWithHours = 0;
      const maxBatches = 20; // Limit to prevent infinite loops (2000 users max)
      let batchCount = 0;

      while (hasMore && batchCount < maxBatches) {
        const response = await clerk.users.getUserList({
          limit: clerkLimit,
          offset
        });

        allUsers = allUsers.concat(response.data);
        hasMore = response.data.length === clerkLimit;
        offset += clerkLimit;
        batchCount++;

        // Count users with hours in current batch
        const batchUsersWithHours = response.data.filter(
          user => (user.publicMetadata?.totalFocusHours || 0) > 0
        ).length;
        usersWithHours += batchUsersWithHours;

        // If we have enough users with hours (with buffer), we can stop
        // We continue loading a bit more to ensure we have the true top 100
        if (usersWithHours >= 150) {
          // Load one more batch to ensure accuracy, then stop
          break;
        }
      }
    } else {
      // For pages > 1, we need all users to properly sort and paginate
      // This is necessary because we can't know which users are on page 2+ without full sorting
      while (hasMore) {
        const response = await clerk.users.getUserList({
          limit: clerkLimit,
          offset
        });

        allUsers = allUsers.concat(response.data);
        hasMore = response.data.length === clerkLimit;
        offset += clerkLimit;
      }
    }

    // Filter users with totalFocusHours and create leaderboard
    const allLeaderboardUsers = allUsers
      .map(user => {
        const totalHours = user.publicMetadata?.totalFocusHours || 0;
        const email = user.emailAddresses[0]?.emailAddress || 'Unknown';
        const username = user.username || email.split('@')[0];
        
        return {
          userId: user.id,
          username: username,
          email: email,
          totalFocusHours: totalHours,
          isCurrentUser: clerkUserId ? user.id === clerkUserId : false
        };
      })
      .filter(user => user.totalFocusHours > 0) // Only include users with hours
      .sort((a, b) => b.totalFocusHours - a.totalFocusHours); // Sort descending

    // Calculate pagination
    const totalUsers = allLeaderboardUsers.length;
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const leaderboard = allLeaderboardUsers.slice(startIndex, endIndex);

    // Find current user's position in full leaderboard
    let currentUserPosition = null;
    if (clerkUserId) {
      const index = allLeaderboardUsers.findIndex(user => user.userId === clerkUserId);
      if (index !== -1) {
        currentUserPosition = index + 1;
      }
    }

    // Include debug info
    const debugInfo = {
      totalUsersFound: allUsers.length,
      usersWithHours: totalUsers,
      usersWithoutHours: allUsers.length - totalUsers,
      page: page,
      totalPages: totalPages
    };

    res.status(200).json({
      success: true,
      leaderboard: leaderboard,
      currentUserPosition: currentUserPosition,
      totalUsers: totalUsers,
      page: page,
      totalPages: totalPages,
      hasMore: page < totalPages,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
};

