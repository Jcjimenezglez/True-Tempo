import fs from "fs";
import path from "path";

export type FaqItem = { q: string; a: string };

export type PseoPage = {
  slug: string;
  category: string;
  title: string;
  description: string;
  h1: string;
  keyword?: string;
  preset?: string;
  related?: string[];
  heroSubtitle?: string;
  painPoints?: string;
  painSolution?: string;
  keywords?: string;
  extraKeywords?: string[];
  tier?: string;
  longFormBlocks?: string[];
  answer?: string;
  faq?: FaqItem[];
  compareAngle?: string;
};

export const CATEGORY_LABELS: Record<string, string> = {
  techniques: "Techniques",
  "use-cases": "Use cases",
  sounds: "Sounds",
  workflows: "Workflows",
  analytics: "Analytics",
  compare: "Compare",
  alternatives: "Alternatives",
  professions: "Professions",
  activities: "Activities",
  faq: "FAQ",
  goals: "Goals",
};

const RESERVED = new Set(["pricing", "blog", "privacy", "terms", "app", "_next"]);

function loadJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function repoRoot() {
  return path.join(process.cwd(), "..");
}

export function loadAllPages(): PseoPage[] {
  const root = repoRoot();
  const pagesJson = loadJson(path.join(root, "pseo", "pages.json"));
  const tiers = fs.existsSync(path.join(root, "pseo", "tiers.json"))
    ? loadJson(path.join(root, "pseo", "tiers.json"))
    : { pages: {} };
  const seen = new Set<string>();
  const pages: PseoPage[] = [];

  function add(raw: PseoPage) {
    if (!raw?.slug || !raw.category || RESERVED.has(raw.category)) return;
    const key = `${raw.category}/${raw.slug}`;
    if (seen.has(key) || seen.has(raw.slug)) return;
    seen.add(key);
    seen.add(raw.slug);
    const tier = raw.tier || tiers.pages?.[key] || "B";
    pages.push({ ...raw, tier });
  }

  for (const page of pagesJson.pages || []) add(page);

  const dbDir = path.join(root, "pseo", "databases");
  if (fs.existsSync(dbDir)) {
    for (const file of fs.readdirSync(dbDir).filter((name) => name.endsWith(".json"))) {
      const db = loadJson(path.join(dbDir, file));
      for (const entry of db.entries || []) {
        const page = { ...entry } as PseoPage;
        if (Array.isArray(page.related)) {
          page.related = page.related.map((url) =>
            url.startsWith("/") ? url : `/${page.category}/${url}`
          );
        }
        add(page);
      }
    }
  }
  return pages;
}

export function getPage(category: string, slug: string) {
  return loadAllPages().find((page) => page.category === category && page.slug === slug);
}

export function pagesInCategory(category: string) {
  return loadAllPages()
    .filter((page) => page.category === category)
    .sort((a, b) => a.h1.localeCompare(b.h1));
}

export function allCategories() {
  return [...new Set(loadAllPages().map((page) => page.category))].sort();
}

export function pagePath(page: PseoPage) {
  return `/${page.category}/${page.slug}/`;
}
