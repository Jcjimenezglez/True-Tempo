// Handles the Todoist OAuth callback and exchanges code for an access token
// Required env vars:
// - TODOIST_CLIENT_ID
// - TODOIST_CLIENT_SECRET
// - TODOIST_REDIRECT_URI

const https = require('https');

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  const { code, state } = req.query || {};
  const expectedState = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('todoist_oauth_state='))?.split('=')[1] || '';

  if (!code || !state) {
    res.status(400).send('Missing code or state');
    return;
  }
  if (state !== expectedState) {
    res.status(400).send('Invalid state');
    return;
  }

  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;
  const redirectUri = process.env.TODOIST_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).send('Todoist OAuth not configured');
    return;
  }

  try {
    const result = await postJson('https://todoist.com/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    });

    if (result.status !== 200 || !result.json || !result.json.access_token) {
      res.status(500).send('Failed to exchange token');
      return;
    }

    const token = result.json.access_token;

    // Store token in secure cookie (demo); ideally tie to authenticated user in DB
    const cookie = [
      `todoist_access_token=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Lax',
      'Max-Age=2592000', // 30 days
      process.env.VERCEL_ENV === 'development' ? '' : 'Secure',
    ].filter(Boolean).join('; ');
    res.setHeader('Set-Cookie', cookie);

    // Redirect back to app
    const appUrl = process.env.PUBLIC_APP_URL || 'https://superfocus.live';
    res.writeHead(302, { Location: appUrl });
    res.end();
  } catch (e) {
    res.status(500).send('OAuth callback error');
  }
};


