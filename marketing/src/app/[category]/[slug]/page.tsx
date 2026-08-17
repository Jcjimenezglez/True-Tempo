import ArticleShell from "@/components/ArticleShell";
import { extraHtmlFor } from "@/lib/copy";
import { getPage, loadAllPages } from "@/lib/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return loadAllPages().map((page) => ({
    category: page.category,
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const page = getPage(category, slug);
  if (!page) return {};
  const url = `https://www.superfocus.live/${page.category}/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.extraKeywords || page.keywords || page.keyword,
    robots: page.tier === "C" ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      images: ["/og-image.png"],
    },
  };
}

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const page = getPage(category, slug);
  if (!page) notFound();
  return <ArticleShell page={page} extraHtml={extraHtmlFor(page)} />;
}
