// api/debug/email-status.js
// Debug endpoint to check email scheduling status for a user

const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  // Only allow in development or with secret
  const authHeader = req.headers.authorization;
  const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}` || 
                       process.env.VERCEL_ENV !== 'production';
  
  if (!isAuthorized && process.env.VERCEL_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const { userId, email } = req.query;
    
    let user;
    
    if (userId) {
      user = await clerk.users.getUser(userId);
    } else if (email) {
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      user = users.data?.[0];
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const metadata = user.publicMetadata || {};
    const scheduledEmails = metadata.scheduledEmails || {};
    
    const now = Date.now();
    
    // Format email status
    const emailStatus = {
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        createdAt: user.createdAt,
      },
      scheduledEmails: {
        signupFollowUp1: {
          scheduledFor: scheduledEmails.signupFollowUp1 ? new Date(scheduledEmails.signupFollowUp1).toISOString() : null,
          sent: scheduledEmails.signupFollowUp1Sent || false,
          ready: scheduledEmails.signupFollowUp1 && now >= scheduledEmails.signupFollowUp1,
        },
        signupFollowUp2: {
          scheduledFor: scheduledEmails.signupFollowUp2 ? new Date(scheduledEmails.signupFollowUp2).toISOString() : null,
          sent: scheduledEmails.signupFollowUp2Sent || false,
          ready: scheduledEmails.signupFollowUp2 && now >= scheduledEmails.signupFollowUp2,
        },
      },
      rawMetadata: metadata,
    };
    
    return res.status(200).json(emailStatus);
    
  } catch (error) {
    console.error('Error in email-status debug:', error);
    return res.status(500).json({ error: error.message });
  }
};
