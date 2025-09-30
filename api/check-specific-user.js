// Check specific user by email
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      return res.status(500).json({ error: 'Clerk secret not configured' });
    }

    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get all users and find the one with omrvieito@gmail.com
    const users = await clerk.users.getUserList({ limit: 100 });
    
    const targetUser = users.data.find(user => 
      user.emailAddresses?.some(email => email.emailAddress === 'omrvieito@gmail.com')
    );

    if (!targetUser) {
      return res.status(404).json({ 
        error: 'User not found',
        searchedEmail: 'omrvieito@gmail.com',
        totalUsers: users.data.length
      });
    }

    res.json({
      message: 'User found',
      userId: targetUser.id,
      email: targetUser.emailAddresses?.[0]?.emailAddress,
      publicMetadata: targetUser.publicMetadata,
      privateMetadata: targetUser.privateMetadata,
      createdAt: targetUser.createdAt,
      lastSignInAt: targetUser.lastSignInAt
    });

  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ 
      error: 'Failed to check user',
      details: error.message 
    });
  }
};
