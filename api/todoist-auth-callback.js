const {
  decodeState,
  getCallbackUrl,
  getOrigin,
  persistTodoistToken,
} = require('./lib/todoist-auth');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

async function verifyProAccess(userId, allowDevMode) {
  if (allowDevMode) return { ok: true };
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  const isPro = user?.publicMetadata?.isPremium === true;
  return {
    ok: isPro,
    error: isPro ? null : 'Pro plan required',
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send('Todoist OAuth is not configured');
    return;
  }
  if (!process.env.CLERK_SECRET_KEY) {
    res.status(500).send('Clerk is not configured');
    return;
  }

  const baseAppUrl = process.env.APP_BASE_URL || getOrigin(req);
  const safeRedirect = new URL('/', baseAppUrl);

  try {
    const code = req.query.code || '';
    const stateToken = req.query.state || '';
    const oauthError = req.query.error || '';

    if (oauthError) {
      safeRedirect.searchParams.set('todoist', 'error');
      safeRedirect.searchParams.set('reason', String(oauthError));
      res.writeHead(302, { Location: safeRedirect.toString() });
      res.end();
      return;
    }

    if (!code || !stateToken) {
      safeRedirect.searchParams.set('todoist', 'error');
      safeRedirect.searchParams.set('reason', 'missing_code_or_state');
      res.writeHead(302, { Location: safeRedirect.toString() });
      res.end();
      return;
    }

    const decodedState = decodeState(String(stateToken));
    const userId = decodedState.uid;

    const accessCheck = await verifyProAccess(userId, Boolean(decodedState.dev));
    if (!accessCheck.ok) {
      safeRedirect.searchParams.set('todoist', 'error');
      safeRedirect.searchParams.set('reason', 'pro_required');
      res.writeHead(302, { Location: safeRedirect.toString() });
      res.end();
      return;
    }

    const callbackUrl = getCallbackUrl(req);
    const tokenResponse = await fetch('https://todoist.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const payload = await tokenResponse.text();
      console.error('todoist-auth-callback token exchange failed:', payload);
      safeRedirect.searchParams.set('todoist', 'error');
      safeRedirect.searchParams.set('reason', 'token_exchange_failed');
      res.writeHead(302, { Location: safeRedirect.toString() });
      res.end();
      return;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token || '';
    if (!accessToken) {
      safeRedirect.searchParams.set('todoist', 'error');
      safeRedirect.searchParams.set('reason', 'missing_access_token');
      res.writeHead(302, { Location: safeRedirect.toString() });
      res.end();
      return;
    }

    await persistTodoistToken(userId, accessToken);

    safeRedirect.searchParams.set('todoist', 'connected');
    res.writeHead(302, { Location: safeRedirect.toString() });
    res.end();
  } catch (error) {
    console.error('todoist-auth-callback error:', error);
    safeRedirect.searchParams.set('todoist', 'error');
    safeRedirect.searchParams.set('reason', 'callback_failed');
    res.writeHead(302, { Location: safeRedirect.toString() });
    res.end();
  }
};
