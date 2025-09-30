// Script to check user metadata in Clerk
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const userId = req.body?.userId || 'user_33EJ5A5tLUngWQuCN03qgcON04q';

  if (!clerkSecret) {
    res.status(500).json({ error: 'Missing CLERK_SECRET_KEY' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const user = await clerk.users.getUser(userId);

    res.status(200).json({
      message: 'User metadata retrieved',
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
    });

  } catch (error) {
    console.error('Error getting user metadata:', error);
    res.status(500).json({ 
      error: 'Failed to get user metadata', 
      details: error.message 
    });
  }
};
