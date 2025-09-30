// Manual fix for specific user
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  try {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecret) {
      return res.status(500).json({ error: 'Clerk secret not configured' });
    }

    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Manual fix for omrvieito@gmail.com
    const targetEmail = 'omrvieito@gmail.com';
    
    // Find user in Clerk
    const users = await clerk.users.getUserList({ limit: 100 });
    const clerkUser = users.data.find(user => 
      user.emailAddresses?.some(email => email.emailAddress === targetEmail)
    );

    if (!clerkUser) {
      return res.status(404).json({ 
        error: 'User not found in Clerk',
        email: targetEmail
      });
    }

    // Update user metadata manually
    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isPremium: true,
        premiumSince: new Date().toISOString(),
        // Note: We'll add stripeCustomerId once we find the correct one
      }
    });

    res.json({
      message: 'User premium status updated manually',
      email: targetEmail,
      clerkUserId: clerkUser.id,
      note: 'Please find the correct Stripe customer ID and update manually'
    });

  } catch (error) {
    console.error('Error manually fixing user:', error);
    res.status(500).json({ 
      error: 'Failed to manually fix user',
      details: error.message 
    });
  }
};
