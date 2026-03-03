const {
  createOAuthState,
  getCallbackUrl,
  getQueryParam,
  requireProContext,
} = require('./lib/todoist-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientId = process.env.TODOIST_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'TODOIST_CLIENT_ID not configured' });
    return;
  }

  const proContext = await requireProContext(req);
  if (!proContext.ok) {
    res.status(proContext.status).json({ error: proContext.error });
    return;
  }

  try {
    const callbackUrl = getCallbackUrl(req);
    const state = createOAuthState({
      userId: proContext.userId,
      devMode: proContext.devMode,
    });

    const authorizationUrl = new URL('https://todoist.com/oauth/authorize');
    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('scope', 'data:read_write');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('redirect_uri', callbackUrl);

    const devMode = getQueryParam(req, 'devMode');
    const bypass = getQueryParam(req, 'bypass');
    if (devMode === 'pro' || bypass === 'true') {
      authorizationUrl.searchParams.set('devMode', 'pro');
    }

    res.writeHead(302, { Location: authorizationUrl.toString() });
    res.end();
  } catch (error) {
    console.error('todoist-auth-start error:', error);
    res.status(500).json({ error: 'Failed to start Todoist OAuth' });
  }
};
