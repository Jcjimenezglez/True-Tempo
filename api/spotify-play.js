// Start playback of a playlist on a device

module.exports = async (req, res) => {
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { device_id, context_uri } = JSON.parse(body || '{}');

    const cookies = (req.headers.cookie || '').split(/;\s*/).reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k) acc[k] = decodeURIComponent(v || '');
      return acc;
    }, {});
    const token = cookies['spotify_access_token'];
    if (!token) {
      res.statusCode = 401;
      res.end('Not connected');
      return;
    }

    const endpoint = new URL('https://api.spotify.com/v1/me/player/play');
    if (device_id) endpoint.searchParams.set('device_id', device_id);

    const r = await fetch(endpoint.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ context_uri }),
    });
    if (![200, 202, 204].includes(r.status)) {
      const txt = await r.text();
      res.statusCode = r.status;
      res.end(txt);
      return;
    }
    res.end('OK');
  } catch (e) {
    res.statusCode = 500;
    res.end('Error');
  }
};


