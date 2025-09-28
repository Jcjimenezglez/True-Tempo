// Handle Spotify OAuth callback, exchange code for tokens, store in httpOnly cookies

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

    const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
    const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
    const redirectUri = (process.env.SPOTIFY_REDIRECT_URI || `https://${req.headers.host}/api/spotify-auth-callback`).trim();

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenResp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body,
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      res.statusCode = 500;
      res.end(`Spotify token exchange failed: ${txt}`);
      return;
    }
    const data = await tokenResp.json();
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 3600;
    if (!accessToken) {
      res.statusCode = 500;
      res.end('Missing access token');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + expiresIn - 60; // refresh a bit early

    const cookies = [
      'spotify_access_token=' + encodeURIComponent(accessToken),
      'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`
    ];
    if (refreshToken) {
      cookies.push('\n');
      cookies.push(['spotify_refresh_token=' + encodeURIComponent(refreshToken), 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', 'Max-Age=31536000'].join('; '));
    }
    cookies.push('\n');
    cookies.push(['spotify_expiry=' + expiry, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`].join('; '));

    res.writeHead(302, {
      Location: '/?spotify=connected',
      'Set-Cookie': cookies.join('')
    });
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(`Callback error: ${e?.message || 'unknown'}`);
  }
};


