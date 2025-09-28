// Refresh Spotify access token using refresh_token cookie

module.exports = async (req, res) => {
  try {
    const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k) acc[k] = decodeURIComponent(v || '');
      return acc;
    }, {});
    const refreshToken = cookies['spotify_refresh_token'];
    if (!refreshToken) {
      res.statusCode = 401;
      res.end('No refresh token');
      return;
    }

    const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
    const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
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
      res.end(`Refresh failed: ${txt}`);
      return;
    }
    const data = await tokenResp.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + expiresIn - 60;

    const accessCookie = [
      'spotify_access_token=' + encodeURIComponent(accessToken),
      'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`
    ].join('; ');

    const expiryCookie = [
      'spotify_expiry=' + expiry,
      'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`
    ].join('; ');

    res.writeHead(200, { 'Set-Cookie': [accessCookie, expiryCookie] });
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(`Error: ${e?.message || 'unknown'}`);
  }
};


