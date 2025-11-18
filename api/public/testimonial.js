// Public endpoint to get testimonial user info
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  const testimonialEmail = 'omrvieito@gmail.com';

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Get all users with pagination to find the testimonial user
    let targetUser = null;
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    let maxPages = 20; // Safety limit

    while (hasMore && !targetUser && maxPages > 0) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      targetUser = response.data.find(user => 
        user.emailAddresses?.some(e => e.emailAddress === testimonialEmail)
      );

      hasMore = response.data.length === limit;
      offset += limit;
      maxPages--;
    }

    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Testimonial user not found' 
      });
    }

    // Return only public information
    // Use specific testimonial image for this user instead of Clerk image
    const testimonialImageUrl = '/images/lifestyle-blog.webp';
    
    res.status(200).json({
      success: true,
      name: targetUser.firstName || targetUser.username || 'Nina',
      imageUrl: testimonialImageUrl, // Use specific image instead of Clerk image
      email: testimonialEmail
    });

  } catch (error) {
    console.error('Error fetching testimonial user:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

