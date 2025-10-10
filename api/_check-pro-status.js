// Helper function to check if user is Pro
// This is imported by other API endpoints to verify Pro status
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function checkProStatus(req) {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    return { isPro: false, error: 'Clerk not configured' };
  }

  // Extract Clerk user ID from headers or cookies
  const clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
  
  if (!clerkUserId) {
    return { isPro: false, error: 'Not authenticated' };
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    const user = await clerk.users.getUser(clerkUserId);
    
    const isPremium = user?.publicMetadata?.isPremium === true;
    
    return { 
      isPro: isPremium, 
      userId: clerkUserId,
      email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
    };
  } catch (e) {
    console.error('Error checking Pro status:', e);
    return { isPro: false, error: 'Failed to verify status' };
  }
}

module.exports = { checkProStatus };

