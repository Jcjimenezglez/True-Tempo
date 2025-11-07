// Test endpoint to simulate webhook processing
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userEmail } = req.body;
  
  if (!userEmail) {
    res.status(400).json({ error: 'userEmail is required' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Find user by email
    const users = await clerk.users.getUserList({ limit: 100 });
    const user = users.data.find(u => 
      u.emailAddresses?.some(email => email.emailAddress === userEmail)
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user with premium status
    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        isPremium: true,
        premiumSince: new Date().toISOString(),
        testUpdate: true
      },
    });

    res.status(200).json({ 
      message: 'User updated successfully',
      userId: user.id,
      email: userEmail,
      isPremium: true
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
