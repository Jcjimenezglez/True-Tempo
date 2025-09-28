// Return a valid Spotify access token for Web Playback SDK

module.exports = async (req, res) => {
  try {
    const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k) acc[k] = decodeURIComponent(v || '');
      return acc;
    }, {});

    const now = Math.floor(Date.now() / 1000);
    let accessToken = cookies['spotify_access_token'] || '';
    const expiry = parseInt(cookies['spotify_expiry'] || '0', 10) || 0;

    // Refresh if missing or expired
    if (!accessToken || now >= expiry) {
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
      accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600;
      const newExpiry = now + expiresIn - 60;

      const accessCookie = [
        'spotify_access_token=' + encodeURIComponent(accessToken),
        'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`
      ].join('; ');
      const expiryCookie = [
        'spotify_expiry=' + newExpiry,
        'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure', `Max-Age=${expiresIn}`
      ].join('; ');

      res.setHeader('Set-Cookie', [accessCookie, expiryCookie]);
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ access_token: accessToken }));
  } catch (e) {
    res.statusCode = 500;
    res.end(`Error: ${e?.message || 'unknown'}`);
  }
};


