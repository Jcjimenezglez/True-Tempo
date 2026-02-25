// API endpoint to get all public cassettes from all users
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { sanitizeCassette } = require('./lib/clerk-metadata-utils');

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

  const clerkUserId = req.headers['x-clerk-userid'];

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
    // Function to check if image URL is valid
    const isImageUrlValid = (imageUrl) => {
      if (!imageUrl || imageUrl.trim() === '') {
        return false;
      }

      const trimmedUrl = imageUrl.trim().toLowerCase();

      // Basic protocol check
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) return false;

      // Check for Google Images redirect (these are invalid)
      const isGoogleRedirect = trimmedUrl.includes('google.com/url') || trimmedUrl.includes('google.com/imgres');
      if (isGoogleRedirect) return false;

      // Trusted image hosting services (these don't need extensions)
      const trustedHosts = [
        'i.imgur.com',
        'images.unsplash.com',
        'cdn.unsplash.com',
        'images.pexels.com',
        'cdn.pexels.com',
        'imgur.com/a/',
        'imgur.com/gallery/',
        'unsplash.com/photos/',
        'pexels.com/photo/',
        'drive.google.com/uc', // Google Drive direct links
        'pbs.twimg.com/media/' // Twitter images
      ];
      const isTrustedHost = trustedHosts.some(host => trimmedUrl.includes(host));
      
      if (isTrustedHost) return true;

      // Remove query parameters for extension check
      // e.g. image.jpg?v=123 -> image.jpg
      const urlWithoutQuery = trimmedUrl.split('?')[0].split('#')[0];

      // List of valid image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico', '.avif'];
      const hasImageExtension = imageExtensions.some(ext => urlWithoutQuery.endsWith(ext));

      return hasImageExtension;
    };
    
    // Get all users with pagination
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    // Collect all public cassettes from all users
    const allPublicCassettes = [];
    const seenIds = new Set(); // To avoid duplicates

    allUsers.forEach(user => {
      const publicCassettes = user.publicMetadata?.publicCassettes || [];
      
      if (Array.isArray(publicCassettes)) {
        // Get creator name from user (same logic as leaderboard)
        const email = user.emailAddresses?.[0]?.emailAddress || 'Unknown';
        const creatorName = user.username || email.split('@')[0];
        
        publicCassettes.forEach(cassette => {
          // Only include if it's marked as public and we haven't seen this ID before
          // AND it has a valid image URL
          if (cassette.isPublic === true && cassette.id && !seenIds.has(cassette.id) && isImageUrlValid(cassette.imageUrl)) {
            seenIds.add(cassette.id);
            const sanitizedCassette = sanitizeCassette(cassette) || cassette;
            // Add creator information to cassette
            allPublicCassettes.push({
              ...sanitizedCassette,
              creatorName: creatorName,
              creatorId: user.id
            });
          }
        });
      }
    });

    // Include debug info
    const debugInfo = {
      totalUsersFound: allUsers.length,
      usersWithPublicCassettes: allUsers.filter(user => {
        const cassettes = user.publicMetadata?.publicCassettes || [];
        return Array.isArray(cassettes) && cassettes.length > 0;
      }).length,
      totalPublicCassettes: allPublicCassettes.length
    };

    res.status(200).json({
      success: true,
      publicCassettes: allPublicCassettes,
      totalCassettes: allPublicCassettes.length,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error fetching public cassettes:', error);
    res.status(500).json({ error: 'Failed to fetch public cassettes', details: error.message });
  }
};

