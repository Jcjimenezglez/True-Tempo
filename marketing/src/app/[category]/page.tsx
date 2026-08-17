import { HubList } from "@/components/ArticleShell";
import { CATEGORY_LABELS, allCategories, pagesInCategory } from "@/lib/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return allCategories().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category] || category;
  return {
    title: `${label} — Superfocus`,
    description: `Guides and timers in ${label.toLowerCase()} from Superfocus, the $1.99/month pomodoro timer.`,
    alternates: { canonical: `https://www.superfocus.live/${category}` },
  };
}

export default async function CategoryHubPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const pages = pagesInCategory(category);
  if (!pages.length) notFound();
  const label = CATEGORY_LABELS[category] || category;
  return (
    <HubList
      title={label}
      intro={`Practical ${label.toLowerCase()} pages for running a pomodoro timer, study timer, or focus timer in Superfocus — not thin doorway copies.`}
      pages={pages}
    />
  );
}
