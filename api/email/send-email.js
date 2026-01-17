// api/email/send-email.js
const { Resend } = require('resend');

// Trim API key to remove potential whitespace/newlines from copy-paste
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
const resend = new Resend(resendApiKey);

// Ensure FROM_EMAIL is always in a valid format and without stray whitespace/newlines
const FROM_EMAIL = (process.env.RESEND_FROM_EMAIL || 'Superfocus <noreply@updates.superfocus.live>').trim();

// Normalize tags to the format expected by Resend:
//   tags: [{ name: 'event', value: 'signup_welcome' }]
function normalizeTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return undefined;
  }

  const first = tags[0];

  // If we receive an array of strings like ['signup_welcome'],
  // convert them to objects with a default value.
  if (typeof first === 'string') {
    return tags.map((name) => ({
      name,
      value: '1',
    }));
  }

  // Assume the caller passed the correct shape already
  return tags;
}

async function sendEmail({ to, subject, html, text, tags = [] }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    // Generate unique ID for tracking
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      tags: normalizeTags(tags),
      headers: {
        'X-Entity-Ref-ID': uniqueId // Unique ID for better tracking
      }
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully:', data?.id, '| Tracking ID:', uniqueId);
    return { success: true, emailId: data?.id, trackingId: uniqueId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };

