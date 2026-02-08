// api/cron/process-scheduled-emails.js
// This endpoint is called by Vercel Cron Jobs to process scheduled emails
// It checks Clerk user metadata for scheduled email tasks and sends them

// Scheduled email processing disabled (welcome email only).

module.exports = async (req, res) => {
  // Verify this is a cron job request (Vercel adds Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    return res.status(200).json({
      success: true,
      disabled: true,
      message: 'Scheduled email processing is disabled. Welcome email only.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in process-scheduled-emails:', error);
    return res.status(500).json({ error: error.message });
  }
};
