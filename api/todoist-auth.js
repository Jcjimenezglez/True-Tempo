// Starts the Todoist OAuth flow by redirecting the user to Todoist
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
// - TODOIST_CLIENT_ID
// - TODOIST_REDIRECT_URI (e.g. https://your-domain.vercel.app/api/todoist-callback)

function generateRandomState(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = async (req, res) => {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const redirectUri = process.env.TODOIST_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Todoist OAuth not configured' });
    return;
  }

  // CSRF protection via state stored in HttpOnly cookie
  const state = generateRandomState(24);
  const cookie = [
    `todoist_oauth_state=${state}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
    process.env.VERCEL_ENV === 'development' ? '' : 'Secure',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);

  const scope = encodeURIComponent('data:read_write');
  const authUrl = `https://todoist.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${scope}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
};


