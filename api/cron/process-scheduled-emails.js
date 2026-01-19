// api/cron/process-scheduled-emails.js
// This endpoint is called by Vercel Cron Jobs to process scheduled emails
// It checks Clerk user metadata for scheduled email tasks and sends them

const { sendEmail } = require('../email/send-email');
const templates = require('../email/templates');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Helper function to delay execution (rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (req, res) => {
  // Verify this is a cron job request (Vercel adds Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const now = Date.now();
    
    // Rate limiting configuration
    const MAX_EMAILS_PER_RUN = 15; // Max emails to send per cron run
    const DELAY_BETWEEN_EMAILS = 700; // 700ms delay = ~1.4 emails/sec (under Resend's 2/sec limit)
    
    let processed = 0;
    let sent = 0;
    let errors = 0;
    let skippedDueToLimit = 0;

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

    for (const user of allUsers) {
      // Stop if we've sent enough emails this run
      if (sent >= MAX_EMAILS_PER_RUN) {
        skippedDueToLimit++;
        continue;
      }

      try {
        const metadata = user.publicMetadata || {};
        const scheduledEmails = metadata.scheduledEmails || {};
        const firstName = user.firstName || user.username || 'there';
        const email = user.emailAddresses?.[0]?.emailAddress;
        
        if (!email) continue;

        // Track emails sent in THIS execution to enforce sequence
        // We only send ONE email per sequence per user per cron run
        let signupEmailSentThisRun = false;

        // Helper to send email with rate limiting
        const sendScheduledEmail = async (templateFn, tag, sentKey) => {
          if (sent >= MAX_EMAILS_PER_RUN) return false;
          
          const template = templateFn({ firstName });
          const result = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: [tag],
          });
          
          if (result.success) {
            // Update metadata to mark as sent
            const freshUser = await clerk.users.getUser(user.id);
            const freshMetadata = freshUser.publicMetadata || {};
            const freshScheduled = freshMetadata.scheduledEmails || {};
            
            await clerk.users.updateUser(user.id, {
              publicMetadata: {
                ...freshMetadata,
                scheduledEmails: {
                  ...freshScheduled,
                  [sentKey]: true,
                },
              },
            });
            
            sent++;
            await delay(DELAY_BETWEEN_EMAILS); // Rate limit
            return true;
          } else {
            errors++;
            return false;
          }
        };

        // ========== SIGNUP SEQUENCE ==========
        // Only send ONE signup email per cron run per user
        // Each email requires the previous one to be sent in a PREVIOUS run (not this one)

        // Check signup follow-up 1 (24 hours after signup)
        if (!signupEmailSentThisRun && 
            scheduledEmails.signupFollowUp1 && 
            !scheduledEmails.signupFollowUp1Sent && 
            now >= scheduledEmails.signupFollowUp1) {
          const sent = await sendScheduledEmail(templates.getSignupFollowUp1, 'signup_followup_1', 'signupFollowUp1Sent');
          if (sent) signupEmailSentThisRun = true;
        }

        // Check signup follow-up 2 (3 days after signup)
        // REQUIRES: signupFollowUp1 must be sent in a PREVIOUS run
        if (!signupEmailSentThisRun && 
            scheduledEmails.signupFollowUp1Sent && // Email 1 must have been sent BEFORE this run
            scheduledEmails.signupFollowUp2 && 
            !scheduledEmails.signupFollowUp2Sent && 
            now >= scheduledEmails.signupFollowUp2) {
          const sent = await sendScheduledEmail(templates.getSignupFollowUp2, 'signup_followup_2', 'signupFollowUp2Sent');
          if (sent) signupEmailSentThisRun = true;
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
      skippedDueToLimit,
      totalUsers: allUsers.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in process-scheduled-emails:', error);
    return res.status(500).json({ error: error.message });
  }
};
