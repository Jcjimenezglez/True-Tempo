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

    // Filter users with totalFocusHours and create leaderboard
    const leaderboard = allUsers
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
      .sort((a, b) => b.totalFocusHours - a.totalFocusHours) // Sort descending
      .slice(0, 100); // Limit to top 100

    // Find current user's position
    let currentUserPosition = null;
    if (clerkUserId) {
      const index = leaderboard.findIndex(user => user.userId === clerkUserId);
      if (index !== -1) {
        currentUserPosition = index + 1;
      }
    }

    res.status(200).json({
      success: true,
      leaderboard: leaderboard,
      currentUserPosition: currentUserPosition,
      totalUsers: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
};

