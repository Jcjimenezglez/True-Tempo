// Check specific user by email
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      return res.status(500).json({ error: 'Clerk secret not configured' });
    }

    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get email from query parameter or use default
    const email = req.query.email || 'julio93.314@gmail.com';
    
    // Get all users and find the one with the specified email
    // Search through multiple pages if needed
    let targetUser = null;
    let allUsers = [];
    let hasMore = true;
    let page = 0;
    
    while (hasMore && !targetUser && page < 10) {
      const users = await clerk.users.getUserList({ 
        limit: 500,
        offset: page * 500
      });
      
      allUsers = allUsers.concat(users.data);
      targetUser = users.data.find(user => 
        user.emailAddresses?.some(e => e.emailAddress === email)
      );
      
      hasMore = users.data.length === 500;
      page++;
    }

    if (!targetUser) {
      return res.status(404).json({ 
        error: 'User not found',
        searchedEmail: email,
        totalUsersSearched: allUsers.length
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
