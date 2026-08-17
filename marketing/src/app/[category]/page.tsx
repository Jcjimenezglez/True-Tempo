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
  const hub: Record<string, { title: string; description: string; keywords: string[] }> = {
    techniques: {
      title: "Pomodoro Technique, Time Blocking & Flowtime | Superfocus",
      description:
        "Pomodoro technique timer, time blocking, flowtime, and deep work presets. Superfocus Premium is $1.99/month.",
      keywords: ["pomodoro technique", "time blocking", "flowtime", "pomodoro technique timer"],
    },
    "use-cases": {
      title: "Study Timer, Focus Timer & Work Timer | Superfocus",
      description:
        "Study timer, focus timer, work timer, writing timer, and ADHD-friendly sprints. Superfocus is $1.99/month.",
      keywords: ["study timer", "focus timer", "work timer", "writing timer"],
    },
    sounds: {
      title: "Focus Music, Lofi Study Music & White Noise | Superfocus",
      description:
        "Focus music, lofi study music, rain sounds, and white noise inside the pomodoro timer. $1.99/month.",
      keywords: ["focus music", "lofi study music", "white noise", "rain sounds for focus"],
    },
    compare: {
      title: "Pomodoro Timer Apps Compared | Superfocus",
      description: "Pomofocus, Forest, Focusmate, and other pomodoro timer apps vs Superfocus. $1.99/month.",
      keywords: ["pomodoro timer apps", "pomofocus", "best pomodoro apps"],
    },
    alternatives: {
      title: "Pomofocus & Forest Alternatives | Superfocus",
      description: "Pomofocus alternative and other pomodoro apps — timer, tasks, and sound. $1.99/month.",
      keywords: ["pomofocus", "pomofocus alternative", "best pomodoro apps"],
    },
    faq: {
      title: "Pomodoro Timer FAQ — How to Focus | Superfocus",
      description: "Pomodoro timer online, how to focus, how to enter flow state, and honest Superfocus pricing.",
      keywords: ["pomodoro timer online", "how to focus", "how to enter flow state"],
    },
  };
  const seo = hub[category] || {
    title: `${label} — Superfocus`,
    description: `Guides and timers in ${label.toLowerCase()} from Superfocus, the $1.99/month pomodoro timer.`,
    keywords: ["pomodoro timer"],
  };
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
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
