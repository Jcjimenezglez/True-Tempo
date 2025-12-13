// Admin API - Fix public cassettes with invalid images
// Moves them to private or deletes them
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    return;
  }

  // Optional: Add admin authentication here if needed
  // For now, this is a one-time cleanup script

  try {
    const clerk = createClerkClient({ secretKey: clerkSecret });
    
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

    console.log(`📊 Found ${allUsers.length} total users`);

    // Function to check if image URL is valid
    const isImageUrlValid = (imageUrl) => {
      if (!imageUrl || imageUrl.trim() === '') {
        return false;
      }

      const trimmedUrl = imageUrl.trim().toLowerCase();

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

    const results = {
      totalUsers: allUsers.length,
      usersProcessed: 0,
      cassettesFixed: 0,
      cassettesDeleted: 0,
      errors: []
    };

    // Process each user
    for (const user of allUsers) {
      try {
        const publicCassettes = user.publicMetadata?.publicCassettes || [];
        
        if (!Array.isArray(publicCassettes) || publicCassettes.length === 0) {
          continue;
        }

        // Find cassettes with invalid images
        const invalidCassettes = publicCassettes.filter(cassette => {
          if (cassette.isPublic !== true) return false;
          return !isImageUrlValid(cassette.imageUrl);
        });

        if (invalidCassettes.length === 0) {
          continue;
        }

        console.log(`🔍 User ${user.id} has ${invalidCassettes.length} invalid public cassettes`);

        // Update cassettes: move to private (set isPublic to false)
        const updatedPublicCassettes = publicCassettes.map(cassette => {
          const isInvalid = invalidCassettes.some(ic => ic.id === cassette.id);
          if (isInvalid) {
            console.log(`  📝 Moving cassette "${cassette.title}" (${cassette.id}) to private`);
            return {
              ...cassette,
              isPublic: false
            };
          }
          return cassette;
        });

        // Update user metadata
        const currentMeta = user.publicMetadata || {};
        const newMeta = {
          ...currentMeta,
          publicCassettes: updatedPublicCassettes
        };

        await clerk.users.updateUser(user.id, {
          publicMetadata: newMeta
        });

        results.usersProcessed++;
        results.cassettesFixed += invalidCassettes.length;

        console.log(`✅ Fixed ${invalidCassettes.length} cassettes for user ${user.id}`);

      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
        results.errors.push({
          userId: user.id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cleanup completed',
      results
    });

  } catch (error) {
    console.error('Error fixing invalid image cassettes:', error);
    res.status(500).json({ 
      error: 'Failed to fix invalid image cassettes', 
      details: error.message 
    });
  }
};

