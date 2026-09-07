import { BLOG_POSTS } from "@/lib/blog-posts";
import { loadAllPages } from "@/lib/catalog";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = "https://www.superfocus.live";

const CORE = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/press", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/release-notes", priority: 0.5, changeFrequency: "weekly" as const },
];

const HUBS = [
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

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes = CORE.map((item) => ({
    url: `${BASE}${item.path === "/" ? "/" : item.path}`,
    lastModified,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
  const hubs = HUBS.map((path) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));
  const articles = loadAllPages()
    .filter((page) => page.tier !== "C")
    .map((page) => ({
      url: `${BASE}/${page.category}/${page.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: page.tier === "A" ? 0.9 : 0.6,
    }));
  const posts = BLOG_POSTS.filter((post) => !post.canonicalTo).map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...hubs, ...articles, ...posts];
}
