const crypto = require('crypto');

function safeStringifyBody(body) {
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body || {});
  } catch (_) {
    return '';
  }
}

function isValidTodoistSignature(req, rawBody) {
  const header = (req.headers['x-todoist-hmac-sha256'] || '').toString().trim();
  if (!header) return false;

  const secret = process.env.TODOIST_CLIENT_SECRET || '';
  if (!secret) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, endpoint: 'todoist-webhook' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = safeStringifyBody(req.body);
    const hasSignature = Boolean(req.headers['x-todoist-hmac-sha256']);
    const signatureValid = hasSignature ? isValidTodoistSignature(req, rawBody) : false;

    if (hasSignature && !signatureValid) {
      console.warn('todoist-webhook: invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const payload = req.body || {};
    const eventName = payload.event_name || payload.eventName || 'unknown';
    const userId = payload.user_id || payload.userId || null;

    // Webhook events are currently acknowledged and logged.
    // Real-time UI sync requires a user-session channel (websocket/SSE) or server-side task state.
    console.log('todoist-webhook received:', {
      eventName,
      userId,
      hasSignature,
      signatureValid,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('todoist-webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
