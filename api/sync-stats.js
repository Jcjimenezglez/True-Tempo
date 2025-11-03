// API endpoint to sync user statistics to Clerk
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
    const { totalHours } = req.body;

    if (typeof totalHours !== 'number' || totalHours < 0) {
      res.status(400).json({ error: 'Invalid totalHours' });
      return;
    }

    // Get current user metadata
    const user = await clerk.users.getUser(clerkUserId);
    const currentMeta = user.publicMetadata || {};

    // Update metadata with totalHours
    const newMeta = {
      ...currentMeta,
      totalFocusHours: totalHours,
      statsLastUpdated: new Date().toISOString()
    };

    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: newMeta
    });

    res.status(200).json({
      success: true,
      totalFocusHours: totalHours
    });
  } catch (error) {
    console.error('Error syncing stats:', error);
    res.status(500).json({ error: 'Failed to sync stats', details: error.message });
  }
};

