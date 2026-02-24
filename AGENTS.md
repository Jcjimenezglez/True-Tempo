# Agents

## Cursor Cloud specific instructions

### Project overview

Superfocus is a Pomodoro/focus timer web app. The frontend is vanilla HTML/CSS/JS (no build step). Backend API routes live in `/api/` as Vercel Serverless Functions (Node.js). See `README.md` and `DEVELOPMENT_SETUP.md` for full context.

### Running the application

- **With Vercel credentials**: `npm run dev` (runs `vercel dev`, serves both frontend and API routes on port 3000). Requires `vercel login` first.
- **Without Vercel credentials**: Use `npx serve -l 3000` to serve the static frontend. API routes (`/api/*`) will not be available, but all client-side timer functionality works.
- The frontend has no build step; changes to `index.html`, `style.css`, and `script.js` are immediately reflected on reload.

### Environment variables

Copy `.env.local.backup` to `.env.local` and fill in real values for Stripe/Clerk keys. Without real keys, API routes will fail but the core timer UI works standalone.

### Testing

- `npm test` runs the Jest test suite (97 tests across 4 files in `__tests__/`).
- No ESLint or TypeScript linting is configured.

### Key caveats

- `vercel dev` requires Vercel CLI authentication (`vercel login` or `--token`). In environments without Vercel credentials, use a static file server (`npx serve`) for frontend-only development.
- Node.js 22.x is required (`engines` field in `package.json`).
- External service API keys (Stripe, Clerk, Resend, etc.) are needed for API route testing but not for frontend development.
