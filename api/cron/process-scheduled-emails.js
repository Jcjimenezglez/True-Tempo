// api/cron/process-scheduled-emails.js
// This endpoint is called by Vercel Cron Jobs to process scheduled emails
// It checks Clerk user metadata for scheduled email tasks and sends them

const { sendEmail } = require('../email/send-email');
const templates = require('../email/templates');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  // Verify this is a cron job request (Vercel adds Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const now = Date.now();
    
    // Get all users (we'll need to paginate in production)
    // For now, we'll process users in batches
    let processed = 0;
    let sent = 0;
    let errors = 0;

    // Get users with scheduled emails metadata
    // We'll use Clerk's user list API and check metadata
    // Process in batches to handle large user bases
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    
    while (hasMore && offset < 1000) { // Safety limit: process max 1000 users per run
      const userListResponse = await clerk.users.getUserList({ limit, offset });
      const userList = userListResponse.data || [];
      allUsers = allUsers.concat(userList);
      hasMore = userList.length === limit;
      offset += limit;
    }
    
    const users = allUsers;
    
    for (const user of users) {
      try {
        const metadata = user.publicMetadata || {};
        const scheduledEmails = metadata.scheduledEmails || {};
        
        // Check for signup follow-up 1 (24 hours after signup)
        if (scheduledEmails.signupFollowUp1 && !scheduledEmails.signupFollowUp1Sent) {
          const scheduledTime = scheduledEmails.signupFollowUp1;
          if (now >= scheduledTime) {
            const firstName = user.firstName || user.username || 'there';
            const email = user.emailAddresses?.[0]?.emailAddress;
            
            if (email) {
              const followUp1 = templates.getSignupFollowUp1({ firstName });
              await sendEmail({
                to: email,
                subject: followUp1.subject,
                html: followUp1.html,
                text: followUp1.text,
                tags: ['signup_followup_1'],
              });
              
              // Mark as sent
              await clerk.users.updateUser(user.id, {
                publicMetadata: {
                  ...metadata,
                  scheduledEmails: {
                    ...scheduledEmails,
                    signupFollowUp1Sent: true,
                  },
                },
              });
              
              sent++;
            }
          }
        }
        
        // Check for signup follow-up 2 (3 days after signup)
        if (scheduledEmails.signupFollowUp2 && !scheduledEmails.signupFollowUp2Sent) {
          const scheduledTime = scheduledEmails.signupFollowUp2;
          if (now >= scheduledTime) {
            const firstName = user.firstName || user.username || 'there';
            const email = user.emailAddresses?.[0]?.emailAddress;
            
            if (email) {
              const followUp2 = templates.getSignupFollowUp2({ firstName });
              await sendEmail({
                to: email,
                subject: followUp2.subject,
                html: followUp2.html,
                text: followUp2.text,
                tags: ['signup_followup_2'],
              });
              
              // Mark as sent
              await clerk.users.updateUser(user.id, {
                publicMetadata: {
                  ...metadata,
                  scheduledEmails: {
                    ...scheduledEmails,
                    signupFollowUp2Sent: true,
                  },
                },
              });
              
              sent++;
            }
          }
        }
        
        // Check for checkout abandoned emails
        if (scheduledEmails.checkoutAbandoned1 && !scheduledEmails.checkoutAbandoned1Sent) {
          const scheduledTime = scheduledEmails.checkoutAbandoned1;
          if (now >= scheduledTime) {
            const firstName = user.firstName || user.username || 'there';
            const email = user.emailAddresses?.[0]?.emailAddress;
            
            if (email) {
              const abandoned1 = templates.getCheckoutAbandonedEmail1({ firstName });
              await sendEmail({
                to: email,
                subject: abandoned1.subject,
                html: abandoned1.html,
                text: abandoned1.text,
                tags: ['checkout_abandoned_1'],
              });
              
              await clerk.users.updateUser(user.id, {
                publicMetadata: {
                  ...metadata,
                  scheduledEmails: {
                    ...scheduledEmails,
                    checkoutAbandoned1Sent: true,
                  },
                },
              });
              
              sent++;
            }
          }
        }
        
        if (scheduledEmails.checkoutAbandoned2 && !scheduledEmails.checkoutAbandoned2Sent) {
          const scheduledTime = scheduledEmails.checkoutAbandoned2;
          if (now >= scheduledTime) {
            const firstName = user.firstName || user.username || 'there';
            const email = user.emailAddresses?.[0]?.emailAddress;
            
            if (email) {
              const abandoned2 = templates.getCheckoutAbandonedEmail2({ firstName });
              await sendEmail({
                to: email,
                subject: abandoned2.subject,
                html: abandoned2.html,
                text: abandoned2.text,
                tags: ['checkout_abandoned_2'],
              });
              
              await clerk.users.updateUser(user.id, {
                publicMetadata: {
                  ...metadata,
                  scheduledEmails: {
                    ...scheduledEmails,
                    checkoutAbandoned2Sent: true,
                  },
                },
              });
              
              sent++;
            }
          }
        }
        
        if (scheduledEmails.checkoutAbandoned3 && !scheduledEmails.checkoutAbandoned3Sent) {
          const scheduledTime = scheduledEmails.checkoutAbandoned3;
          if (now >= scheduledTime) {
            const firstName = user.firstName || user.username || 'there';
            const email = user.emailAddresses?.[0]?.emailAddress;
            
            if (email) {
              const abandoned3 = templates.getCheckoutAbandonedEmail3({ firstName });
              await sendEmail({
                to: email,
                subject: abandoned3.subject,
                html: abandoned3.html,
                text: abandoned3.text,
                tags: ['checkout_abandoned_3'],
              });
              
              await clerk.users.updateUser(user.id, {
                publicMetadata: {
                  ...metadata,
                  scheduledEmails: {
                    ...scheduledEmails,
                    checkoutAbandoned3Sent: true,
                  },
                },
              });
              
              sent++;
            }
          }
        }
        
        processed++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errors++;
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      sent,
      errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in process-scheduled-emails:', error);
    return res.status(500).json({ error: error.message });
  }
};

