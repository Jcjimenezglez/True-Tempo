// API endpoint to increment website clicks for a public cassette
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
  const clickerUserId = req.headers['x-clerk-userid'] || null; // User who clicked the website button

  if (!cassetteId) {
    res.status(400).json({ error: 'cassetteId is required' });
    return;
  }

  // For guest users, use a session-based identifier or skip incrementing
  // For now, we'll skip incrementing for guest users to ensure unique clicks
  if (!clickerUserId) {
    // Guest users - we could use session ID or IP, but for simplicity, we'll skip
    res.status(200).json({
      success: false,
      message: 'Clicks only counted for authenticated users',
      websiteClicks: null
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
          
          // Get array of user IDs who have clicked this cassette
          const clickedBy = cassette.clickedBy || [];
          
          // Check if this user has already clicked this cassette
          if (clickedBy.includes(clickerUserId)) {
            // User has already clicked, don't increment
            res.status(200).json({
              success: true,
              websiteClicks: cassette.websiteClicks || 0,
              clickedBy: cassette.clickedBy || [],
              cassetteId: cassetteId,
              alreadyClicked: true
            });
            return;
          }
          
          // User hasn't clicked yet, add to clickedBy and increment clicks
          const currentWebsiteClicks = cassette.websiteClicks || 0;
          publicCassettes[cassetteIndex] = {
            ...cassette,
            websiteClicks: currentWebsiteClicks + 1,
            clickedBy: [...clickedBy, clickerUserId] // Add clicker to the list
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
            websiteClicks: publicCassettes[cassetteIndex].websiteClicks,
            clickedBy: publicCassettes[cassetteIndex].clickedBy || [],
            cassetteId: cassetteId,
            alreadyClicked: false
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
    console.error('Error incrementing cassette website clicks:', error);
    res.status(500).json({ error: 'Failed to increment website clicks', details: error.message });
  }
};

