// Fetch user's playlists using access token from cookie

async function getAccessToken(req, res) {
  const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k) acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
  let token = cookies['spotify_access_token'];
  const expiry = parseInt(cookies['spotify_expiry'] || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if ((!token || now >= expiry) && cookies['spotify_refresh_token']) {
    // Try refresh
    try {
      const resp = await fetch('https://' + req.headers.host + '/api/spotify-refresh');
      if (resp.ok) {
        const setCookie = resp.headers.get('set-cookie');
        // Not strictly needed here; browser will store cookies
        token = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
          const [k, v] = part.split('=');
          if (k) acc[k] = decodeURIComponent(v || '');
          return acc;
        }, {})['spotify_access_token'];
      }
    } catch (_) {}
  }
  return token;
}

module.exports = async (req, res) => {
  try {
    const token = await getAccessToken(req, res);
    if (!token) {
      res.statusCode = 401;
      res.end('Not connected');
      return;
    }
    const r = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const json = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
  } catch (e) {
    res.statusCode = 500;
    res.end('Error');
  }
};


