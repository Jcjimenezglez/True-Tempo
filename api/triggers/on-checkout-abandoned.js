// api/triggers/on-checkout-abandoned.js
// Call this when user cancels checkout (already tracked in pricing/index.html)

const { sendEmail } = require('../email/send-email');
const templates = require('../email/templates');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    // Get user info
    let userEmail = email;
    let firstName = 'there';

    if (userId) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerk.users.getUser(userId);
        userEmail = user.emailAddresses?.[0]?.emailAddress || email;
        firstName = user.firstName || user.username || 'there';
      } catch (error) {
        console.error('Error fetching user from Clerk:', error);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Could not determine user email' });
    }

    // Schedule abandoned checkout emails using Clerk metadata
    // This is more reliable than setTimeout in serverless functions
    if (userId) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerk.users.getUser(userId);
        const metadata = user.publicMetadata || {};
        
        const now = Date.now();
        const scheduledEmails = {
          ...(metadata.scheduledEmails || {}),
          checkoutAbandoned1: now + (1 * 60 * 60 * 1000), // 1 hour
          checkoutAbandoned2: now + (24 * 60 * 60 * 1000), // 24 hours
          checkoutAbandoned3: now + (3 * 24 * 60 * 60 * 1000), // 3 days
        };
        
        await clerk.users.updateUser(userId, {
          publicMetadata: {
            ...metadata,
            scheduledEmails,
          },
        });
        
        console.log('✅ Scheduled checkout abandoned emails in Clerk metadata');
      } catch (error) {
        console.error('Error scheduling checkout abandoned emails:', error);
        // Don't fail the request if scheduling fails
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Checkout abandoned email sequence started'
    });

  } catch (error) {
    console.error('Error in on-checkout-abandoned trigger:', error);
    return res.status(500).json({ error: error.message });
  }
};

