# SEO Setup Guide - Superfocus

Domain: https://www.superfocus.live

## Tier system (A / B / C)

Every pSEO page has a `tier` field in JSON and in `pseo/tiers.json` (slug → tier reference).

| Tier | Indexing | Sitemap priority | Purpose |
|------|----------|------------------|---------|
| **A** | `index, follow` | 0.9 | Money pages — homepage spokes, compare, alternatives |
| **B** | `index, follow` | 0.8 | Expansion pages — techniques, use-cases, sounds, competitors |
| **C** | `noindex, follow` | excluded | Thin long-tail until enriched (then promote to B) |

**Build behavior (`scripts/build-pseo.js`):**
- Tier C → `<meta name="robots" content="noindex, follow">`
- Sitemap includes only tier A + B pSEO pages, hubs, blog (minus canonicalized posts), core URLs
- Hub pages list only indexable (non-C) pages, with Tier A slugs first per category

**Adding a new page:**
1. Add entry to `pseo/pages.json` or `pseo/databases/*.json` with `"tier": "B"` (default)
2. Add slug to `pseo/tiers.json` → `pages` map
3. Run `npm run build`

### Tier A URLs (request indexing after every major deploy)

- `/` (homepage)
- `/pricing`
- `/techniques/pomodoro-technique`
- `/techniques/deep-work-timer`
- `/use-cases/study-timer`
- `/use-cases/focus-timer`
- `/use-cases/focus-website-for-studying`
- `/compare/superfocus-vs-pomofocus`
- `/alternatives/pomofocus`
- `/alternatives/best-pomodoro-apps`
- `/alternatives/hustly-focus`
- `/faq/pomodoro-timer-online`

## Keyword strategy

**Primary demand source:** Google Ads Keyword Planner seeded on Pomofocus (market leader), validated by GSC.

- Head terms: `pomodoro timer`, `pomodoro timer online`, `pomodoro technique`, `study timer`, `focus timer`, `best pomodoro app`, `hustly focus`
- **Title/H1 rule (all tiers):** `[Keyword] — [short benefit] | Superfocus` — no pain-style question H1s
- Tier A pages use optional `longFormBlocks: string[]` in JSON for 600+ word sections

## Build Commands

```bash
npm run build              # pain copy → SEO plan → assets → pSEO + sitemap
npm run apply-seo-plan     # tier fields, keyword-first titles, longFormBlocks
npm run apply-pain-copy    # legacy pain fields (runs before SEO plan in build)
npm run build:assets       # minify JS/CSS to dist/
npm run build:pseo         # regenerate landing pages, hubs, blog, sitemap
```

**Workflow after copy changes:**
1. Edit `pseo/pages.json`, `pseo/databases/*.json`, or run `scripts/apply-seo-plan.js`
2. Run `npm run build`
3. Deploy via `git push` (Vercel auto-deploys — do not also run `vercel --prod`)

## Blog canonical rules

Posts with `canonicalTo` in `pseo/blog/posts.json`:
- `pomofocus-vs-superfocus` → `/compare/superfocus-vs-pomofocus` (noindex)
- `best-pomodoro-timers-2026` → `/alternatives/best-pomodoro-apps` (noindex)

## Structured Data (JSON-LD)

- Homepage: Organization, SoftwareApplication, HowTo, FAQPage
- `/techniques/pomodoro-technique`: HowTo
- `/alternatives/best-pomodoro-apps`: ItemList
- `/compare/*` and `/faq/*`: FAQPage where FAQ data exists
- Hub pages: CollectionPage

## Technical SEO

- `sitemap.xml` — auto-regenerated (~55–100 indexable URLs depending on tier promotions)
- `robots.txt` — allows crawlers, blocks `/api/`
- `llms.txt`, `.well-known/security.txt`
- Redirects in `vercel.json`: `superfocus.live` → `www`, legacy paths → spokes
- `/press` — press kit for off-site listings (Product Hunt, AlternativeTo)

## Post-deploy checklist (GSC — manual)

1. Replace `YOUR_VERIFICATION_CODE` in `index.html` with real GSC meta tag
2. Re-submit sitemap: `https://www.superfocus.live/sitemap.xml`
3. **Request indexing** for all Tier A URLs (list above)
4. Coverage issues to resolve one-by-one in URL Inspection:
   - **Discovered not indexed** — should drop after Tier C noindex + smaller sitemap; do not force-index Tier C
   - **Canonical alternates** — verify no duplicate `/` vs trailing-slash URLs (`trailingSlash: false` in vercel.json)
   - **Redirects** — audit chains in `vercel.json`
   - **Robots blocked** — confirm only admin/preview paths
   - **404 / redirect errors** — add 301 or remove internal links
5. Confirm `superfocus.live` (non-www) impressions decline (301 to www)

## Off-site authority (Phase 4 — manual)

| Action | Notes |
|--------|-------|
| [Product Hunt](https://www.producthunt.com/) | List as Pomodoro / focus timer |
| [AlternativeTo](https://alternativeto.net/) | Submit as Pomofocus alternative |
| Reddit | r/pomodoro, r/GetStudying — helpful answers with links when relevant |
| Guest posts | Link to `/techniques/pomodoro-technique` or `/alternatives/best-pomodoro-apps` |
| Directories | SaaSHub, ToolFinder |
| Press kit | `/press` — logos, facts, contact |

## KPIs (baseline Aug 2026)

Review GSC every 2 weeks. Segment GA4 by `?ref=pseo-{slug}`.

| Metric | Baseline | 30d | 90d | 6m |
|--------|----------|-----|-----|-----|
| Indexed pages | 34 | 55+ | 80 | 103 |
| Clicks/month | 434 | 550 | 800 | 1,500 |
| Homepage CTR | 2.6% | 3.5% | 4% | 5% |
| hustly-focus CTR | 0.4% | 3% | 5% | — |
| pomodoro-technique position | 22.9 | 18 | 12 | 8 |

### GSC query → page mapping

| Query | Target page |
|-------|-------------|
| start focus | `/` H1 + hero |
| easy/simple deep work timer | `/techniques/deep-work-timer` |
| hustly focus | `/alternatives/hustly-focus` |
| pomodoro technique | `/techniques/pomodoro-technique` |
| best pomodoro app | `/alternatives/best-pomodoro-apps` |
| flocus alternatives | `/alternatives/flocus-alternative` |
| pomodoro for adhd | `/faq/pomodoro-for-adhd` |
| live pomodoro | `/faq/pomodoro-timer-online` |

## Tier C reindexation workflow

When a Tier C page has ≥600 words (`longFormBlocks`), keyword-first title/H1, and 3+ `related` links:

1. Set `"tier": "B"` in JSON + update `pseo/tiers.json`
2. `npm run build` → page re-enters sitemap with `index, follow`
3. Request indexing in GSC

**Promotion order:** FAQ → sounds → study-types → professions → activities → goals → durations

## Priority keyword clusters

1. **Pomodoro / focus timer:** `/techniques/pomodoro-technique`, `/faq/pomodoro-timer-online`, `/use-cases/focus-timer`
2. **Study focus:** `/use-cases/study-timer`, `/use-cases/focus-website-for-studying`
3. **Competitors:** `/compare/superfocus-vs-pomofocus`, `/alternatives/pomofocus`, `/alternatives/hustly-focus`, `/alternatives/best-pomodoro-apps`
