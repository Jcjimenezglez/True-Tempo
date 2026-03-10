#!/usr/bin/env node
/**
 * Build script for pSEO Phase 1 pages.
 * Reads pseo/pages.json and pseo/template.html, generates static HTML for each page.
 * Output: techniques/, use-cases/, sounds/, workflows/, analytics/, compare/, alternatives/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PSEO_DIR = path.join(ROOT, 'pseo');
const PAGES_JSON = path.join(PSEO_DIR, 'pages.json');
const TEMPLATE_PATH = path.join(PSEO_DIR, 'template.html');
const BASE_URL = 'https://www.superfocus.live';

function loadJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function getSectionWhy(page) {
  const category = page.category;
  const preset = page.preset || 'Pomodoro';
  const keyword = page.keyword;
  const defaults = {
    techniques: `Structured time blocks help you enter flow state and reduce decision fatigue. Superfocus offers ${preset} plus ambient sounds (lofi, rain, cafe) to enhance focus.`,
    'use-cases': `Whether you're studying, coding, or working remotely, a dedicated focus timer keeps you on track. Superfocus combines ${preset} with task tracking and analytics.`,
    sounds: `Ambient sounds and focus music reduce distractions and signal your brain to focus. Superfocus includes built-in cassettes plus Spotify integration.`,
    workflows: `Combining your task manager with a Pomodoro timer creates a predictable workflow. Superfocus syncs with Todoist so you can track pomodoros per task.`,
    analytics: `Tracking focus time reveals patterns and motivates consistency. Superfocus Premium shows daily, weekly, and monthly trends.`,
    compare: `Superfocus combines a Pomodoro timer, ambient sounds (lofi, rain, cafe), Todoist sync, and productivity analytics in one app. Try it free.`,
    alternatives: `Superfocus offers Pomodoro, Flow, Deep Work, and custom timers; ambient cassettes; Todoist integration; and analytics. Free to start, no credit card.`
  };
  return defaults[category] || defaults.techniques;
}

function getFaq(page) {
  const category = page.category;
  const keyword = page.keyword;
  const baseFaq = [
    {
      q: `What is the best ${keyword}?`,
      a: `Superfocus offers ${page.preset || 'Pomodoro'} plus ambient sounds, task tracking, and analytics. Free to try.`
    },
    {
      q: 'Is Superfocus free?',
      a: 'Yes. Superfocus is free to use. Free users get 2 hours of focus per day. Upgrade to Premium for unlimited focus, all timer techniques, Todoist sync, and analytics.'
    },
    {
      q: 'Does Superfocus have ambient sounds?',
      a: 'Yes. Superfocus includes lofi, rain, cafe, and other focus cassettes. You can also add your own Spotify playlists.'
    }
  ];
  if (category === 'compare' && page.competitor) {
    baseFaq.unshift({
      q: `Which is better: Superfocus or ${page.competitor}?`,
      a: `Superfocus adds ambient sounds, Todoist sync, analytics, and multiple timer presets (Pomodoro, Flow, Deep Work). ${page.competitor} has its own strengths. Try Superfocus free to compare.`
    });
  }
  return baseFaq.map(f => `
            <h3>${f.q}</h3>
            <p>${f.a}</p>`).join('\n');
}

function getCompareTable(page) {
  if (page.category !== 'compare' || !page.competitor) return '';
  const comp = page.competitor;
  return `
        <section class="pseo-section">
            <h2>Superfocus vs ${comp}</h2>
            <table style="width:100%; border-collapse: collapse; color: rgba(255,255,255,0.9); font-size: 0.95rem;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);"><th style="text-align:left; padding:10px 0;">Feature</th><th style="text-align:left; padding:10px 0;">Superfocus</th><th style="text-align:left; padding:10px 0;">${comp}</th></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Pomodoro timer</td><td>✓</td><td>✓</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Ambient sounds / music</td><td>✓</td><td>Varies</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Todoist integration</td><td>✓</td><td>Varies</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding:10px 0;">Analytics</td><td>✓</td><td>Varies</td></tr>
                <tr><td style="padding:10px 0;">Free tier</td><td>✓</td><td>Varies</td></tr>
            </table>
            <p style="margin-top:12px;"><a href="${page.competitorUrl || '#'}" target="_blank" rel="noopener">Learn more about ${comp} →</a></p>
        </section>`;
}

function getRelatedLinks(related) {
  if (!Array.isArray(related) || related.length === 0) return '';
  return related.map(url => `<li><a href="${url}">${url.replace(/^\//, '').replace(/\//g, ' › ')}</a></li>`).join('\n            ');
}

function getExternalLinks(page) {
  const links = [];
  if (page.keyword && page.keyword.toLowerCase().includes('pomodoro')) {
    links.push({ url: 'https://en.wikipedia.org/wiki/Pomodoro_Technique', text: 'Pomodoro Technique (Wikipedia)' });
  }
  if (page.category === 'compare' && page.competitorUrl) {
    links.push({ url: page.competitorUrl, text: page.competitor });
  }
  if (links.length === 0) return '';
  const items = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.text}</a>`).join(' · ');
  return `<section class="pseo-external"><p>Further reading: ${items}</p></section>`;
}

function buildPage(page, template) {
  const category = page.category;
  const slug = page.slug;
  const canonicalPath = `/${category}/${slug}`;

  let html = template
    .replace(/\{\{TITLE\}\}/g, page.title)
    .replace(/\{\{DESCRIPTION\}\}/g, page.description)
    .replace(/\{\{KEYWORD\}\}/g, page.keyword)
    .replace(/\{\{CANONICAL_PATH\}\}/g, canonicalPath)
    .replace(/\{\{H1\}\}/g, page.h1)
    .replace(/\{\{PRESET\}\}/g, page.preset || 'Pomodoro (25/5/15 min)')
    .replace(/\{\{SECTION_WHY\}\}/g, getSectionWhy(page))
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{FAQ\}\}/g, getFaq(page))
    .replace(/\{\{RELATED_LINKS\}\}/g, getRelatedLinks(page.related))
    .replace(/\{\{EXTERNAL_LINKS\}\}/g, getExternalLinks(page))
    .replace(/\{\{COMPARE_TABLE\}\}/g, getCompareTable(page));

  return html;
}

function main() {
  if (!fs.existsSync(PAGES_JSON)) {
    console.error('Missing pseo/pages.json');
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Missing pseo/template.html');
    process.exit(1);
  }

  const { pages } = loadJson(PAGES_JSON);
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const outputDirs = new Set();
  const generated = [];

  for (const page of pages) {
    const category = page.category;
    const slug = page.slug;
    const outputDir = path.join(ROOT, category);
    const outputPath = path.join(outputDir, `${slug}.html`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      outputDirs.add(category);
    }

    const html = buildPage(page, template);
    fs.writeFileSync(outputPath, html, 'utf8');
    generated.push(`/${category}/${slug}`);
  }

  console.log(`Generated ${generated.length} pSEO pages.`);
  console.log('Slugs:', generated.join('\n'));

  // Update sitemap.xml with new pSEO URLs
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const today = new Date().toISOString().slice(0, 10);
  const coreUrls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/pricing', priority: '0.9', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
    { loc: '/release-notes', priority: '0.7', changefreq: 'weekly' }
  ];
  const pseoUrls = generated.map(loc => ({
    loc: BASE_URL + loc,
    priority: '0.8',
    changefreq: 'monthly'
  }));
  const allUrls = [
    ...coreUrls.map(u => ({ ...u, loc: BASE_URL + u.loc })),
    ...pseoUrls
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `    <url>
        <loc>${u.loc}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('Updated sitemap.xml');

  return generated;
}

main();
