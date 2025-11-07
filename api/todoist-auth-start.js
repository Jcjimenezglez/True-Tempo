// Start Todoist OAuth flow (Pro only)
// Env required: TODOIST_CLIENT_ID, TODOIST_REDIRECT_URI, TODOIST_SCOPE (optional)

const { checkProStatus } = require('./_check-pro-status');

module.exports = async (req, res) => {
  try {
    // Verify Pro status
    const proCheck = await checkProStatus(req);
    if (!proCheck.isPro) {
      res.writeHead(302, { Location: '/?error=pro_required' });
      res.end();
      return;
    }

    const clientId = process.env.TODOIST_CLIENT_ID;
    const providedRedirect = process.env.TODOIST_REDIRECT_URI;
    const scope = process.env.TODOIST_SCOPE || 'data:read_write';

    if (!clientId) {
      res.statusCode = 500;
      res.end('Missing TODOIST_CLIENT_ID');
      return;
    }

    // Fallback redirect if not explicitly set
    const host = req.headers.host;
    const fallbackRedirect = `https://${host}/api/todoist-auth-callback`;
    const redirectUri = (providedRedirect || fallbackRedirect).trim();

    const state = Math.random().toString(36).slice(2);

    const url = new URL('https://todoist.com/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);
    url.searchParams.set('redirect_uri', redirectUri);

    res.writeHead(302, { Location: url.toString() });
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(`Failed to start OAuth: ${e?.message || 'unknown'}`);
  }
};


