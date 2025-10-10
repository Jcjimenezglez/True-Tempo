// Start Notion OAuth flow (Pro only)
// Env required: NOTION_CLIENT_ID, NOTION_REDIRECT_URI

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

    const clientId = process.env.NOTION_CLIENT_ID;
    const providedRedirect = process.env.NOTION_REDIRECT_URI;

    if (!clientId) {
      res.statusCode = 500;
      res.end('Missing NOTION_CLIENT_ID');
      return;
    }

    // Fallback redirect if not explicitly set
    const host = req.headers.host;
    const fallbackRedirect = `https://${host}/api/notion-auth-callback`;
    const redirectUri = (providedRedirect || fallbackRedirect).trim();

    const state = Math.random().toString(36).slice(2);

    const url = new URL('https://api.notion.com/v1/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('owner', 'user');
    url.searchParams.set('state', state);

    res.writeHead(302, { Location: url.toString() });
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(`Failed to start OAuth: ${e?.message || 'unknown'}`);
  }
};

