// Admin endpoint to change user status (free/pro)
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Admin authentication disabled for now
  // const adminKey = req.headers['x-admin-key'];
  // if (adminKey !== process.env.ADMIN_SECRET_KEY) {
  //   res.status(401).json({ error: 'Unauthorized' });
  //   return;
  // }

  const { userId, action, reason } = req.body;
  
  if (!userId || !action) {
    res.status(400).json({ error: 'userId and action are required' });
    return;
  }

  if (!['add', 'remove'].includes(action)) {
    res.status(400).json({ error: 'action must be "add" or "remove"' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get current user data
    const user = await clerk.users.getUser(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPremium = action === 'add';
    const premiumSince = isPremium ? new Date().toISOString() : null;

    // Update user metadata
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        isPremium: isPremium,
        premiumSince: premiumSince,
        ...(isPremium
          ? {}
          : {
              paymentType: 'free',
              isLifetime: false,
              isTrial: false,
              confirmedByCheckout: false,
              confirmedSessionId: null,
            }),
        adminUpdated: true,
        adminUpdatedAt: new Date().toISOString(),
        adminUpdatedReason: reason || 'manual_override',
      },
    });

    // Log the action
    console.log(`Admin action: User ${user.emailAddresses?.[0]?.emailAddress} (${userId}) ${action === 'add' ? 'granted' : 'removed'} Pro status`);

    res.status(200).json({
      success: true,
      message: `User ${action === 'add' ? 'granted' : 'removed'} Pro status successfully`,
      userId: userId,
      isPremium: isPremium
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
