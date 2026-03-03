# Integrations Setup

This document explains how to configure integrations for Superfocus, with Todoist as the primary OAuth integration.

## Todoist Integration

### Required Environment Variables

Set these variables in Vercel (Production + Preview) and in local `.env.local` for development:

```bash
TODOIST_CLIENT_ID=your_todoist_client_id
TODOIST_CLIENT_SECRET=your_todoist_client_secret
TODOIST_OAUTH_REDIRECT_URI=https://www.superfocus.live/api/todoist-auth-callback
TODOIST_STATE_SECRET=replace_with_random_long_string
APP_BASE_URL=https://www.superfocus.live
```

For local development, use:

```bash
TODOIST_OAUTH_REDIRECT_URI=http://localhost:3000/api/todoist-auth-callback
APP_BASE_URL=http://localhost:3000
```

`TODOIST_STATE_SECRET` is recommended to sign OAuth state. If missing, backend falls back to `CLERK_SECRET_KEY`.

### Todoist Developer App Configuration

1. Open Todoist Developer Console.
2. Create (or edit) your OAuth app.
3. Add Redirect URIs:
   - `http://localhost:3000/api/todoist-auth-callback`
   - `https://www.superfocus.live/api/todoist-auth-callback`
4. Copy client id and client secret into environment variables.

The redirect URI in Todoist must exactly match `TODOIST_OAUTH_REDIRECT_URI` used by each environment.

### Backend Endpoints Used

- `GET /api/todoist-auth-start`
- `GET /api/todoist-auth-callback`
- `GET /api/todoist-status`
- `GET /api/todoist-projects`
- `GET /api/todoist-tasks`
- `POST /api/todoist-complete`
- `POST /api/todoist-disconnect`

Todoist tokens are stored in Clerk `privateMetadata.todoistIntegration`.

### Access Rules

- Only Pro users can use Todoist endpoints.
- Dev bypass is available through existing `devMode=pro&bypass=true` flow.
- Frontend uses `uid` query param for server-side user resolution in OAuth/status/data calls.

### Feature Flag (Rollout / Rollback)

Todoist UI is guarded by:

```js
window.SUPERFOCUS_FEATURES.todoistIntegration
```

- Default behavior: enabled (if `SUPERFOCUS_FEATURES` is not set).
- Rollback quickly by setting:

```js
window.SUPERFOCUS_FEATURES = { todoistIntegration: false };
```

### Manual Smoke Test Checklist

1. Log in as Pro user.
2. Open Tasks modal and connect Todoist.
3. Complete OAuth and verify redirect back with connected state.
4. Open import modal and verify projects/tasks load.
5. Import tasks and confirm they appear in local task list.
6. Complete a Todoist task and verify it closes remotely.
7. Disconnect and verify status returns disconnected.
8. Validate Free/Guest users cannot access integration endpoints.

