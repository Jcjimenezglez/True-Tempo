// Start Spotify OAuth flow
// Env required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
// Scope minimal: user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative

module.exports = async (req, res) => {
  try {
    const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
    if (!clientId) {
      res.statusCode = 500;
      res.end('Missing SPOTIFY_CLIENT_ID');
      return;
    }

    const scope = process.env.SPOTIFY_SCOPE || [
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const host = req.headers.host;
    const redirectUri = (process.env.SPOTIFY_REDIRECT_URI || `https://${host}/api/spotify-auth-callback`).trim();
    const state = Math.random().toString(36).slice(2);

    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', scope);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);

    res.writeHead(302, { Location: url.toString() });
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(`Failed to start Spotify OAuth: ${e?.message || 'unknown'}`);
  }
};


