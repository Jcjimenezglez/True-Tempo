# Agents

## Cursor Cloud specific instructions

### Project overview

Superfocus is a Pomodoro/focus timer web app. The frontend is vanilla HTML/CSS/JS (no build step). Backend API routes live in `/api/` as Vercel Serverless Functions (Node.js). See `README.md` and `DEVELOPMENT_SETUP.md` for full context.

### Running the application

- **With Vercel credentials**: `npm run dev` (runs `vercel dev`, serves both frontend and API routes on port 3000). Requires `vercel login` first.
- **Without Vercel credentials**: Use `npx serve -l 3000` to serve the static frontend. API routes (`/api/*`) will not be available.
- Marketing HTML (`/`, `/pricing`, `/blog`, `/privacy`, `/terms`, `/techniques`, `/use-cases`, `/compare`, and other pSEO hubs) is generated from `marketing/` (`npm run build:marketing`). The timer stays at `/app`. Header CTA on marketing pages is **View pricing**.
- The frontend has no build step for HTML/CSS/JS; hashed `/dist` assets are used by `/app`.

### Environment variables

Copy `.env.local.backup` to `.env.local` and fill in real values for Stripe/Clerk keys. Without real keys, API routes will fail but the core timer UI works standalone.

### Testing

- `npm test` runs the Jest test suite (97 tests across 4 files in `__tests__/`).
- No ESLint or TypeScript linting is configured.

### Pull requests

- After the work is done and the PR is opened, **merge it into `main` without waiting** for a separate “merge this” message. Fast-forward `main` and `git push origin main` (do not also run `vercel --prod`).

### Deploy (avoid duplicate deploys)

- **Do not run both** `git push` **and** `vercel --prod`. Vercel auto-deploys on push when the repo is connected.
- Use: `git add ... && git commit -m "..." && git push` (no `vercel --prod`).
- **After every `git push` to `main` (and after feature-branch pushes that trigger Vercel), check the Vercel deployment.** Use the Vercel MCP `list_deployments` + `get_deployment_build_logs` (errorsOnly) for project `true-tempo`. Wait until state is `READY`. If state is `ERROR`, read the logs, fix, push again, and re-check. Do not treat a successful git push as a successful deploy.
- Marketing lives in `marketing/` with its own `package.json`. Root `npm install` does not install `next`. `build:marketing` must run `npm --prefix marketing ci` before `next build`.

### Key caveats

- `vercel dev` requires Vercel CLI authentication (`vercel login` or `--token`). In environments without Vercel credentials, use a static file server (`npx serve`) for frontend-only development.
- Node.js 22.x is required (`engines` field in `package.json`).
- External service API keys (Stripe, Clerk, Resend, etc.) are needed for API route testing but not for frontend development.
