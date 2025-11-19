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

    // Schedule abandoned checkout emails
    // Note: In production, you might want to use a proper queue system
    
    // Email 1: After 1 hour
    setTimeout(async () => {
      try {
        const email1 = templates.getCheckoutAbandonedEmail1({ firstName });
        await sendEmail({
          to: userEmail,
          subject: email1.subject,
          html: email1.html,
          text: email1.text,
          tags: ['checkout_abandoned_1'],
        });
      } catch (error) {
        console.error('Error sending checkout abandoned email 1:', error);
      }
    }, 1 * 60 * 60 * 1000);

    // Email 2: After 24 hours
    setTimeout(async () => {
      try {
        const email2 = templates.getCheckoutAbandonedEmail2({ firstName });
        await sendEmail({
          to: userEmail,
          subject: email2.subject,
          html: email2.html,
          text: email2.text,
          tags: ['checkout_abandoned_2'],
        });
      } catch (error) {
        console.error('Error sending checkout abandoned email 2:', error);
      }
    }, 24 * 60 * 60 * 1000);

    // Email 3: After 3 days
    setTimeout(async () => {
      try {
        const email3 = templates.getCheckoutAbandonedEmail3({ firstName });
        await sendEmail({
          to: userEmail,
          subject: email3.subject,
          html: email3.html,
          text: email3.text,
          tags: ['checkout_abandoned_3'],
        });
      } catch (error) {
        console.error('Error sending checkout abandoned email 3:', error);
      }
    }, 3 * 24 * 60 * 60 * 1000);

    return res.status(200).json({ 
      success: true, 
      message: 'Checkout abandoned email sequence started'
    });

  } catch (error) {
    console.error('Error in on-checkout-abandoned trigger:', error);
    return res.status(500).json({ error: error.message });
  }
};

