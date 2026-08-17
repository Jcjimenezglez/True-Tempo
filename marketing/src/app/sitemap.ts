import { BLOG_POSTS } from "@/lib/blog-posts";
import { loadAllPages } from "@/lib/catalog";
import type { MetadataRoute } from "next";

const BASE = "https://www.superfocus.live";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/pricing", "/blog", "/privacy", "/terms"].map((path) => ({
    url: `${BASE}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const hubs = [
    "/techniques",
    "/use-cases",
    "/sounds",
    "/compare",
    "/alternatives",
    "/faq",
    "/workflows",
    "/analytics",
    "/goals",
    "/professions",
    "/activities",
  ].map((path) => ({
    url: `${BASE}${path}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const articles = loadAllPages()
    .filter((page) => page.tier !== "C")
    .map((page) => ({
      url: `${BASE}/${page.category}/${page.slug}/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page.tier === "A" ? 0.9 : 0.6,
    }));
  const posts = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}/`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...hubs, ...articles, ...posts];
}
