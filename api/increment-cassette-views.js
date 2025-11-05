// API endpoint to increment views for a public cassette (unique views per user)
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

  const { cassetteId } = req.body;
  const viewerUserId = req.headers['x-clerk-userid'] || null; // User who is viewing the cassette

  if (!cassetteId) {
    res.status(400).json({ error: 'cassetteId is required' });
    return;
  }

  // For guest users, use a session-based identifier or skip incrementing
  // For now, we'll skip incrementing for guest users to ensure unique views
  if (!viewerUserId) {
    // Guest users - we could use session ID or IP, but for simplicity, we'll skip
    res.status(200).json({
      success: false,
      message: 'Views only counted for authenticated users',
      views: null
    });
    return;
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

    // Find the user who owns this cassette
    let cassetteFound = false;
    for (const user of allUsers) {
      const publicCassettes = user.publicMetadata?.publicCassettes || [];
      
      if (Array.isArray(publicCassettes)) {
        const cassetteIndex = publicCassettes.findIndex(c => c.id === cassetteId && c.isPublic === true);
        
        if (cassetteIndex >= 0) {
          cassetteFound = true;
          
          const cassette = publicCassettes[cassetteIndex];
          
          // Get array of user IDs who have viewed this cassette
          const viewedBy = cassette.viewedBy || [];
          
          // Check if this user has already viewed this cassette
          if (viewedBy.includes(viewerUserId)) {
            // User has already viewed, don't increment
            res.status(200).json({
              success: true,
              views: cassette.views || 0,
              cassetteId: cassetteId,
              alreadyViewed: true
            });
            return;
          }
          
          // User hasn't viewed yet, add to viewedBy and increment views
          const currentViews = cassette.views || 0;
          publicCassettes[cassetteIndex] = {
            ...cassette,
            views: currentViews + 1,
            viewedBy: [...viewedBy, viewerUserId] // Add viewer to the list
          };

          // Update user metadata
          const currentMeta = user.publicMetadata || {};
          const newMeta = {
            ...currentMeta,
            publicCassettes: publicCassettes
          };

          await clerk.users.updateUser(user.id, {
            publicMetadata: newMeta
          });

          res.status(200).json({
            success: true,
            views: publicCassettes[cassetteIndex].views,
            cassetteId: cassetteId,
            alreadyViewed: false
          });
          return;
        }
      }
    }

    if (!cassetteFound) {
      res.status(404).json({ error: 'Cassette not found' });
      return;
    }
  } catch (error) {
    console.error('Error incrementing cassette views:', error);
    res.status(500).json({ error: 'Failed to increment views', details: error.message });
  }
};

