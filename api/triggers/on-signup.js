// api/triggers/on-signup.js
// This endpoint should be called when a user signs up
// You can call it from Clerk webhook or from your frontend after signup

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

    // Get user info from Clerk if userId provided
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

    // Send welcome email immediately
    const welcomeTemplate = templates.getWelcomeEmailTemplate({ firstName });
    const welcomeResult = await sendEmail({
      to: userEmail,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
      tags: ['signup_welcome'],
    });

    // Follow-up emails disabled; welcome email only.
    if (userId) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerk.users.getUser(userId);
        const metadata = user.publicMetadata || {};

        await clerk.users.updateUser(userId, {
          publicMetadata: {
            ...metadata,
            scheduledEmails: {},
          },
        });
      } catch (error) {
        console.error('Error clearing scheduled emails:', error);
        // Don't fail the request if cleanup fails
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Signup email sequence started',
      welcomeEmailSent: welcomeResult.success
    });

  } catch (error) {
    console.error('Error in on-signup trigger:', error);
    return res.status(500).json({ error: error.message });
  }
};

