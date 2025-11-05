// API endpoint to get all public cassettes from all users
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

    // Collect all public cassettes from all users
    const allPublicCassettes = [];
    const seenIds = new Set(); // To avoid duplicates

    allUsers.forEach(user => {
      const publicCassettes = user.publicMetadata?.publicCassettes || [];
      
      if (Array.isArray(publicCassettes)) {
        // Get creator name from user (same logic as leaderboard)
        const email = user.emailAddresses?.[0]?.emailAddress || 'Unknown';
        const creatorName = user.username || email.split('@')[0];
        
        publicCassettes.forEach(cassette => {
          // Only include if it's marked as public and we haven't seen this ID before
          if (cassette.isPublic === true && cassette.id && !seenIds.has(cassette.id)) {
            seenIds.add(cassette.id);
            // Add creator information to cassette
            allPublicCassettes.push({
              ...cassette,
              creatorName: creatorName,
              creatorId: user.id
            });
          }
        });
      }
    });

    // Include debug info
    const debugInfo = {
      totalUsersFound: allUsers.length,
      usersWithPublicCassettes: allUsers.filter(user => {
        const cassettes = user.publicMetadata?.publicCassettes || [];
        return Array.isArray(cassettes) && cassettes.length > 0;
      }).length,
      totalPublicCassettes: allPublicCassettes.length
    };

    res.status(200).json({
      success: true,
      publicCassettes: allPublicCassettes,
      totalCassettes: allPublicCassettes.length,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error fetching public cassettes:', error);
    res.status(500).json({ error: 'Failed to fetch public cassettes', details: error.message });
  }
};

