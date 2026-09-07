const fs = require("fs");
const path = require("path");
const {
  BASE_URL,
  HUB_PATHS,
  CORE_URLS,
  isIndexablePage,
  loadBlogPosts,
  buildSitemapEntries,
} = require("../scripts/lib/sitemap-urls");

const ROOT = path.resolve(__dirname, "..");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadAllPages() {
  const pagesJson = loadJson(path.join(ROOT, "pseo", "pages.json"));
  const tiers = loadJson(path.join(ROOT, "pseo", "tiers.json"));
  const seen = new Set();
  const pages = [];

  function add(raw) {
    if (!raw?.slug || !raw.category) return;
    const key = `${raw.category}/${raw.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    const tier = raw.tier || tiers.pages?.[key] || "B";
    pages.push({ ...raw, tier });
  }

  for (const page of pagesJson.pages || []) add(page);
  const dbDir = path.join(ROOT, "pseo", "databases");
  for (const file of fs.readdirSync(dbDir).filter((name) => name.endsWith(".json"))) {
    const db = loadJson(path.join(dbDir, file));
    for (const entry of db.entries || []) add(entry);
  }
  return pages;
}

describe("pSEO sitemap coverage", () => {
  const pages = loadAllPages();
  const blogPosts = loadBlogPosts(ROOT);
  const lastmod = "2026-09-07";
  const entries = buildSitemapEntries({ pages, blogPosts, lastmod });
  const locs = new Set(entries.map((e) => e.loc));

  it("includes every indexable catalog leaf", () => {
    const missing = pages
      .filter(isIndexablePage)
      .map((p) => `${BASE_URL}/${p.category}/${p.slug}`)
      .filter((url) => !locs.has(url));
    expect(missing).toEqual([]);
  });

  it("includes every marketing hub", () => {
    const missing = HUB_PATHS.map((hub) => BASE_URL + hub).filter((url) => !locs.has(url));
    expect(missing).toEqual([]);
  });

  it("includes core marketing URLs", () => {
    const missing = CORE_URLS.map((u) => BASE_URL + u.loc).filter((url) => !locs.has(url));
    expect(missing).toEqual([]);
  });

  it("excludes noindex Tier C pages", () => {
    const leaked = pages
      .filter((p) => p.tier === "C")
      .map((p) => `${BASE_URL}/${p.category}/${p.slug}`)
      .filter((url) => locs.has(url));
    expect(leaked).toEqual([]);
  });

  it("excludes canonicalized blog duplicates", () => {
    const leaked = blogPosts
      .filter((p) => p.canonicalTo)
      .map((p) => `${BASE_URL}/blog/${p.slug}`)
      .filter((url) => locs.has(url));
    expect(leaked).toEqual([]);
  });

  it("does not invent catalog slugs", () => {
    const known = new Set(pages.map((p) => `${BASE_URL}/${p.category}/${p.slug}`));
    const articleLocs = [...locs].filter((url) => {
      const pathName = url.replace(BASE_URL, "");
      return (
        pathName.split("/").filter(Boolean).length === 2 &&
        !pathName.startsWith("/blog/")
      );
    });
    const invented = articleLocs.filter((url) => !known.has(url));
    expect(invented).toEqual([]);
  });

  it("uses blog post dates as lastmod", () => {
    const why = entries.find((e) => e.loc.endsWith("/blog/why-cant-i-focus"));
    expect(why.lastmod).toBe("2026-08-13");
  });

  it("covers the September crawl-recovery floor (hubs + former C leaves)", () => {
    expect(entries.length).toBeGreaterThanOrEqual(120);
    expect(pages.filter((p) => p.tier === "C")).toHaveLength(0);
    expect(locs.has(`${BASE_URL}/use-cases/study-timer-for-flashcards`)).toBe(true);
    expect(locs.has(`${BASE_URL}/faq/`)).toBe(true);
    expect(locs.has(`${BASE_URL}/faq/how-to-focus`)).toBe(true);
  });
});
