// Admin endpoint to get all users
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Admin authentication disabled for now
  // const adminKey = req.headers['x-admin-key'];
  // if (adminKey !== process.env.ADMIN_SECRET_KEY) {
  //   res.status(401).json({ error: 'Unauthorized' });
  //   return;
  // }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get all users
    const users = await clerk.users.getUserList({ limit: 100 });
    
    // Format user data
    const formattedUsers = users.data.map(user => ({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || 'No email',
      isPremium: user.publicMetadata?.isPremium || false,
      stripeCustomerId: user.publicMetadata?.stripeCustomerId || null,
      premiumSince: user.publicMetadata?.premiumSince || null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
