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

    // Filter only public cassettes
    const publicCassettes = cassettes.filter(c => c.isPublic === true);

    // Update metadata with public cassettes
    const newMeta = {
      ...currentMeta,
      publicCassettes: publicCassettes
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

