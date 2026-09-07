/**
 * Shared sitemap URL inventory for Superfocus marketing pages.
 * Used by scripts/build-pseo.js and __tests__/sitemap-coverage.test.js.
 */
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://www.superfocus.live";

const CORE_URLS = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/pricing", priority: "0.9", changefreq: "monthly" },
  { loc: "/press", priority: "0.6", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.5", changefreq: "yearly" },
  { loc: "/terms", priority: "0.5", changefreq: "yearly" },
  { loc: "/release-notes", priority: "0.5", changefreq: "weekly" },
];

const HUB_PATHS = [
  "/techniques/",
  "/use-cases/",
  "/sounds/",
  "/compare/",
  "/alternatives/",
  "/faq/",
  "/workflows/",
  "/analytics/",
  "/goals/",
  "/professions/",
  "/activities/",
  "/blog/",
];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isIndexablePage(page) {
  return page.tier !== "C";
}

function getSitemapPriority(page) {
  if (page.tier === "A") return "0.9";
  return "0.8";
}

function loadBlogPosts(root) {
  const postsPath = path.join(root, "pseo", "blog", "posts.json");
  if (!fs.existsSync(postsPath)) return [];
  return loadJson(postsPath);
}

function buildSitemapEntries({ pages, blogPosts, lastmod }) {
  const indexablePages = pages.filter(isIndexablePage);
  const indexablePosts = blogPosts.filter((post) => !post.canonicalTo);

  const core = CORE_URLS.map((u) => ({
    loc: BASE_URL + u.loc,
    lastmod,
    changefreq: u.changefreq,
    priority: u.priority,
  }));

  const hubs = HUB_PATHS.map((loc) => ({
    loc: BASE_URL + loc,
    lastmod,
    changefreq: "weekly",
    priority: loc === "/blog/" ? "0.85" : "0.85",
  }));

  const articles = indexablePages.map((page) => ({
    loc: `${BASE_URL}/${page.category}/${page.slug}`,
    lastmod,
    changefreq: "monthly",
    priority: getSitemapPriority(page),
  }));

  const posts = indexablePosts.map((post) => ({
    loc: `${BASE_URL}/blog/${post.slug}`,
    lastmod: post.date || lastmod,
    changefreq: "monthly",
    priority: "0.75",
  }));

  const seen = new Set();
  const all = [];
  for (const entry of [...core, ...hubs, ...articles, ...posts]) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    all.push(entry);
  }
  return all;
}

function renderSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (u) => `    <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`
  )
  .join("\n")}
</urlset>
`;
}

module.exports = {
  BASE_URL,
  CORE_URLS,
  HUB_PATHS,
  isIndexablePage,
  getSitemapPriority,
  loadBlogPosts,
  buildSitemapEntries,
  renderSitemapXml,
};
