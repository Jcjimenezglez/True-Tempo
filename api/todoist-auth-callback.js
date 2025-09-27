// Handle Todoist OAuth callback: exchange code for token and store in secure cookie

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) {
      res.statusCode = 400;
      res.end(`OAuth error: ${error}`);
      return;
    }
    if (!code) {
      res.statusCode = 400;
      res.end('Missing code');
      return;
    }

    const clientId = process.env.TODOIST_CLIENT_ID;
    const clientSecret = process.env.TODOIST_CLIENT_SECRET;
    const providedRedirect = process.env.TODOIST_REDIRECT_URI;
    const host = req.headers.host;
    const redirectUri = (providedRedirect || `https://${host}/api/todoist-auth-callback`).trim();

    const form = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenResp = await fetch('https://todoist.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      res.statusCode = 500;
      res.end(`Token exchange failed: ${txt}`);
      return;
    }
    const data = await tokenResp.json();
    const accessToken = data.access_token;
    if (!accessToken) {
      res.statusCode = 500;
      res.end('Missing access token');
      return;
    }

    // Set httpOnly secure cookie with token (1 year)
    const cookie = [
      'todoist_access_token=' + encodeURIComponent(accessToken),
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=31536000',
      'Secure',
    ].join('; ');

    res.writeHead(302, { 
      Location: '/?todoist=connected',
      'Set-Cookie': cookie,
    });
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(`Callback error: ${e?.message || 'unknown'}`);
  }
};


