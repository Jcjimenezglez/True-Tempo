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

    // Schedule follow-up emails
    // Note: In production, you might want to use a proper queue system
    // For now, we'll use setTimeout (works for Vercel serverless functions)
    
    // Email 1: After 24 hours
    setTimeout(async () => {
      try {
        const followUp1 = templates.getSignupFollowUp1({ firstName });
        await sendEmail({
          to: userEmail,
          subject: followUp1.subject,
          html: followUp1.html,
          text: followUp1.text,
          tags: ['signup_followup_1'],
        });
      } catch (error) {
        console.error('Error sending signup follow-up 1:', error);
      }
    }, 24 * 60 * 60 * 1000);

    // Email 2: After 3 days
    setTimeout(async () => {
      try {
        const followUp2 = templates.getSignupFollowUp2({ firstName });
        await sendEmail({
          to: userEmail,
          subject: followUp2.subject,
          html: followUp2.html,
          text: followUp2.text,
          tags: ['signup_followup_2'],
        });
      } catch (error) {
        console.error('Error sending signup follow-up 2:', error);
      }
    }, 3 * 24 * 60 * 60 * 1000);

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

