// api/debug/run-cron.js
// Manually trigger the email cron job for testing

const { sendEmail } = require('../email/send-email');
const templates = require('../email/templates');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  // Only allow with CRON_SECRET
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized - use Bearer CRON_SECRET' });
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const now = Date.now();
    
    const results = {
      timestamp: new Date().toISOString(),
      usersProcessed: 0,
      emailsSent: 0,
      errors: [],
      details: [],
    };

    // Get users
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    
    while (hasMore && offset < 500) {
      const userListResponse = await clerk.users.getUserList({ limit, offset });
      const userList = userListResponse.data || [];
      allUsers = allUsers.concat(userList);
      hasMore = userList.length === limit;
      offset += limit;
    }
    
    results.totalUsers = allUsers.length;
    
    for (const user of allUsers) {
      try {
        const metadata = user.publicMetadata || {};
        const scheduledEmails = metadata.scheduledEmails || {};
        const userEmail = user.emailAddresses?.[0]?.emailAddress;
        const firstName = user.firstName || user.username || 'there';
        
        if (!userEmail) continue;
        
        let userDetails = {
          userId: user.id,
          email: userEmail,
          emailsSent: [],
        };
        
        // Check signup follow-up 1
        if (scheduledEmails.signupFollowUp1 && !scheduledEmails.signupFollowUp1Sent && now >= scheduledEmails.signupFollowUp1) {
          const template = templates.getSignupFollowUp1({ firstName });
          const result = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: ['signup_followup_1'],
          });
          
          if (result.success) {
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...metadata,
                scheduledEmails: { ...scheduledEmails, signupFollowUp1Sent: true },
              },
            });
            userDetails.emailsSent.push('signupFollowUp1');
            results.emailsSent++;
          } else {
            results.errors.push({ user: userEmail, email: 'signupFollowUp1', error: result.error });
          }
        }
        
        // Check signup follow-up 2
        if (scheduledEmails.signupFollowUp2 && !scheduledEmails.signupFollowUp2Sent && now >= scheduledEmails.signupFollowUp2) {
          const template = templates.getSignupFollowUp2({ firstName });
          const result = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: ['signup_followup_2'],
          });
          
          if (result.success) {
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...metadata,
                scheduledEmails: { ...scheduledEmails, signupFollowUp2Sent: true },
              },
            });
            userDetails.emailsSent.push('signupFollowUp2');
            results.emailsSent++;
          } else {
            results.errors.push({ user: userEmail, email: 'signupFollowUp2', error: result.error });
          }
        }
        
        if (userDetails.emailsSent.length > 0) {
          results.details.push(userDetails);
        }
        
        results.usersProcessed++;
        
      } catch (error) {
        results.errors.push({ user: user.id, error: error.message });
      }
    }
    
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Error in run-cron debug:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
};
