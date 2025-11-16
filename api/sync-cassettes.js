// API endpoint to sync cassettes to Clerk
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
    const { cassettes } = req.body;

    if (!Array.isArray(cassettes)) {
      res.status(400).json({ error: 'Invalid cassettes array' });
      return;
    }

    // Get current user metadata
    const user = await clerk.users.getUser(clerkUserId);
    const currentMeta = user.publicMetadata || {};
    const existingPublicCassettes = currentMeta.publicCassettes || [];

    // Filter only public cassettes
    const publicCassettes = cassettes.filter(c => c.isPublic === true);

    // Preserve historical data (views, websiteClicks, viewedBy, clickedBy) from existing cassettes
    const publicCassettesWithHistory = publicCassettes.map(cassette => {
      // Find existing cassette in Clerk by ID
      const existingCassette = existingPublicCassettes.find(ec => ec.id === cassette.id);
      
      if (existingCassette) {
        // Preserve historical data from Clerk (source of truth for views/clicks)
        return {
          ...cassette,
          views: existingCassette.views !== undefined && existingCassette.views !== null 
            ? existingCassette.views 
            : (cassette.views || 0),
          websiteClicks: existingCassette.websiteClicks !== undefined && existingCassette.websiteClicks !== null 
            ? existingCassette.websiteClicks 
            : (cassette.websiteClicks || 0),
          viewedBy: existingCassette.viewedBy || cassette.viewedBy || [],
          clickedBy: existingCassette.clickedBy || cassette.clickedBy || []
        };
      }
      
      // New cassette - use provided values or defaults
      return {
        ...cassette,
        views: cassette.views || 0,
        websiteClicks: cassette.websiteClicks || 0,
        viewedBy: cassette.viewedBy || [],
        clickedBy: cassette.clickedBy || []
      };
    });

    // Update metadata with public cassettes (preserving historical data)
    const newMeta = {
      ...currentMeta,
      publicCassettes: publicCassettesWithHistory
    };

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: newMeta
    });

    res.status(200).json({
      success: true,
      publicCassettesCount: publicCassettes.length
    });
  } catch (error) {
    console.error('Error syncing cassettes:', error);
    res.status(500).json({ error: 'Failed to sync cassettes', details: error.message });
  }
};

