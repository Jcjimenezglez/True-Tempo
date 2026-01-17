// api/test-send-welcome.js
// Test endpoint to manually send welcome email
const { sendEmail } = require('./email/send-email');
const { getWelcomeEmailTemplate } = require('./email/templates');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { email, firstName = 'there' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        usage: 'POST { "email": "your@email.com", "firstName": "YourName" }'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log(`📧 Test: Sending welcome email to ${email}`);

    // Get welcome email template
    const emailTemplate = getWelcomeEmailTemplate({ firstName });

    // Send email
    const result = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      tags: ['test_welcome', 'manual_send']
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Welcome email sent successfully to ${email}`,
        emailId: result.emailId,
        trackingId: result.trackingId,
        note: 'Check your inbox (and spam folder). Also check Resend Dashboard for tracking.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send email'
      });
    }

  } catch (error) {
    console.error('❌ Error in test-send-welcome:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
