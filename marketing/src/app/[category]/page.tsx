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
        "Pomodoro technique timer, time blocking, flowtime, and deep work presets. Superfocus Premium is $1.99/month after a 7-day trial.",
      keywords: ["pomodoro technique", "time blocking", "flowtime", "pomodoro technique timer"],
    },
    "use-cases": {
      title: "Study Timer, Focus Timer & Work Timer | Superfocus",
      description:
        "Study timer, focus timer, work timer, writing timer, and ADHD-friendly sprints. Superfocus is $1.99/month after a 7-day trial.",
      keywords: ["study timer", "focus timer", "work timer", "writing timer"],
    },
    sounds: {
      title: "Focus Music, Lofi Study Music & White Noise | Superfocus",
      description:
        "Focus music, lofi study music, rain sounds, and white noise inside the pomodoro timer. $1.99/month after a 7-day trial.",
      keywords: ["focus music", "lofi study music", "white noise", "rain sounds for focus"],
    },
    compare: {
      title: "Pomodoro Timer Apps Compared | Superfocus",
      description: "Pomofocus, Forest, Focusmate, and other pomodoro timer apps vs Superfocus. $1.99/month after a 7-day trial.",
      keywords: ["pomodoro timer apps", "pomofocus", "best pomodoro apps"],
    },
    alternatives: {
      title: "Pomofocus & Forest Alternatives | Superfocus",
      description: "Pomofocus alternative and other pomodoro apps — timer, tasks, and sound. $1.99/month after a 7-day trial.",
      keywords: ["pomofocus", "pomofocus alternative", "best pomodoro apps"],
    },
    faq: {
      title: "Pomodoro Timer FAQ — How to Focus | Superfocus",
      description: "Pomodoro timer online, how to focus, how to enter flow state, and honest Superfocus pricing. $1.99/month after a 7-day trial.",
      keywords: ["pomodoro timer online", "how to focus", "how to enter flow state"],
    },
    workflows: {
      title: "Pomodoro Workflows — Todoist & Task Planning | Superfocus",
      description: "Todoist pomodoro and task-planning workflows next to the Superfocus timer. $1.99/month after a 7-day trial.",
      keywords: ["todoist pomodoro", "task planning", "pomodoro workflow"],
    },
    analytics: {
      title: "Pomodoro Statistics & Focus Time Tracking | Superfocus",
      description: "Track completed pomodoros and focus time — not tab-open hours. $1.99/month after a 7-day trial.",
      keywords: ["pomodoro statistics", "focus time tracking", "productivity analytics"],
    },
    goals: {
      title: "Focus Goals — Flow, Habits & Fewer Distractions | Superfocus",
      description: "Enter flow, build focus habits, and block distractions with a named timer. $1.99/month after a 7-day trial.",
      keywords: ["enter flow state", "build focus habits", "block distractions"],
    },
    professions: {
      title: "Focus Timers for Lawyers, Designers & Teachers | Superfocus",
      description: "Profession-specific focus timer setups for research, drafting, and lesson prep. $1.99/month after a 7-day trial.",
      keywords: ["focus timer for lawyers", "focus timer for designers", "focus timer for teachers"],
    },
    activities: {
      title: "Focus Timers for Email, Research & Planning | Superfocus",
      description: "Batch email, research, and planning in timed blocks instead of all-day reactivity. $1.99/month after a 7-day trial.",
      keywords: ["focus timer for email", "focus timer for research", "focus timer for planning"],
    },
  };
  const seo = hub[category] || {
    title: `${label} — Superfocus`,
    description: `Guides and timers in ${label.toLowerCase()} from Superfocus. $1.99/month after a 7-day trial.`,
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
