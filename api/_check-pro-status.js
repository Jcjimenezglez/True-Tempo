// Helper function to check if user is Pro
// This is imported by other API endpoints to verify Pro status
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function checkProStatus(req) {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecret) {
    return { isPro: false, error: 'Clerk not configured' };
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Try to get user ID from multiple sources
    let clerkUserId = '';
    
    // 1. From header (used by some endpoints)
    clerkUserId = (req.headers['x-clerk-userid'] || '').toString().trim();
    
    // 2. From query parameter (used by OAuth redirects)
    if (!clerkUserId && req.url) {
      const url = new URL(req.url, `https://${req.headers.host}`);
      clerkUserId = url.searchParams.get('uid') || '';
    }
    
    // 3. From query object (Vercel serverless format)
    if (!clerkUserId && req.query && req.query.uid) {
      clerkUserId = req.query.uid;
    }
    
    if (!clerkUserId) {
      return { isPro: false, error: 'Not authenticated' };
    }
    
    const user = await clerk.users.getUser(clerkUserId);
    const isPremium = user?.publicMetadata?.isPremium === true;
    
    console.log(`Pro status check for ${user.emailAddresses?.[0]?.emailAddress}: ${isPremium ? 'PRO' : 'FREE'}`);
    
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

