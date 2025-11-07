// Handle Google Calendar OAuth callback
// Env required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      res.writeHead(302, { Location: '/?error=google_calendar_auth_failed' });
      res.end();
      return;
    }

    const host = req.headers.host;
    const fallbackRedirect = `https://${host}/api/google-calendar-auth-callback`;
    const redirectUri = (process.env.GOOGLE_REDIRECT_URI || fallbackRedirect).trim();

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      res.writeHead(302, { Location: '/?error=google_calendar_token_failed' });
      res.end();
      return;
    }

    // Set cookie with access token and refresh token
    const cookies = [`google_calendar_access_token=${encodeURIComponent(tokenData.access_token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`];
    
    if (tokenData.refresh_token) {
      cookies.push(`google_calendar_refresh_token=${encodeURIComponent(tokenData.refresh_token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`);
    }
    
    res.setHeader('Set-Cookie', cookies);
    
    res.writeHead(302, { Location: '/?google_calendar_connected=true' });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: '/?error=google_calendar_callback_failed' });
    res.end();
  }
};

