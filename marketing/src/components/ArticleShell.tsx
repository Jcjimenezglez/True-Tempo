import ViewPricingLink from "@/components/ViewPricingLink";
import { CATEGORY_LABELS, type PseoPage, pagePath } from "@/lib/catalog";

function splitLines(value?: string) {
  if (!value) return [];
  return value
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

export default function ArticleShell({
  page,
  extraHtml,
}: {
  page: PseoPage;
  extraHtml: string;
}) {
  const keyword = page.keyword || page.h1;
  const related = (page.related || []).slice(0, 6);
  const faqs = page.faq?.length
    ? page.faq
    : [
        {
          q: `What is a ${keyword}?`,
          a: `${page.h1} is a timed focus block you run in the browser. Superfocus keeps the clock, one task, and optional sound in the same tab so you do not bounce to YouTube or another timer.`,
        },
        {
          q: "Do I need the classic 25/5 Pomodoro?",
          a: "Only if it fits the work. Superfocus ships Pomodoro 25/5, Sprint, Flow, and Deep Work. Pick the shortest block you will actually start, then lengthen once the first session finishes.",
        },
        {
          q: "How much does Superfocus cost?",
          a: "Premium is $1.99/month after you create an account. Subscribe, then use the timer at /app.",
        },
      ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.replace(/<[^>]+>/g, "") },
    })),
  };
  const RELATED_HREF: Record<string, string> = {
    "todoist-pomodoro": "/workflows/todoist-pomodoro/",
    "productivity-analytics": "/analytics/productivity-analytics/",
    "pomofocus-alternative": "/alternatives/pomofocus/",
    "forest-app-alternative": "/alternatives/forest-app/",
    "focusmate-alternative": "/alternatives/focusmate-alternative/",
    "best-pomodoro-apps-2026": "/alternatives/best-pomodoro-apps/",
  };
  function relatedHref(raw: string) {
    if (RELATED_HREF[raw]) return RELATED_HREF[raw];
    if (raw.startsWith("/")) return raw.endsWith("/") ? raw : `${raw}/`;
    if (raw.includes("/")) return `/${raw}/`.replace(/\/+/g, "/");
    return `/${raw}/`;
  }
  function relatedLabel(raw: string) {
    return raw.replace(/\/$/, "").split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || raw;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        <a href="/" className="hover:text-white">
          Home
        </a>
        {" / "}
        <a href={`/${page.category}/`} className="hover:text-white">
          {CATEGORY_LABELS[page.category] || page.category}
        </a>
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{page.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-400">
        {page.heroSubtitle || page.description}
      </p>
      <div className="mt-6">
        <ViewPricingLink />
      </div>

      <figure className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
        <img
          src="/images/Timer.png"
          alt={`${keyword} — Superfocus pomodoro timer in the browser`}
          className="h-auto w-full"
        />
        <figcaption className="px-4 py-3 text-sm text-zinc-500">
          The Superfocus timer — one task, one clock, optional cassette audio.
        </figcaption>
      </figure>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">The stall</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {splitLines(page.painPoints).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">The block</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {splitLines(page.painSolution).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {page.preset ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-[#141416] px-5 py-4 text-sm text-zinc-300">
          Suggested Superfocus preset: <strong className="text-white">{page.preset}</strong>
        </p>
      ) : null}

      {page.answer ? (
        <section className="prose-article mt-10" dangerouslySetInnerHTML={{ __html: `<h2>Direct answer</h2><p>${page.answer}</p>` }} />
      ) : null}

      {page.longFormBlocks?.length ? (
        <section
          className="prose-article mt-10"
          dangerouslySetInnerHTML={{ __html: page.longFormBlocks.join("\n") }}
        />
      ) : null}

      <section className="prose-article mt-10" dangerouslySetInnerHTML={{ __html: extraHtml }} />

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Questions people actually ask</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-2xl border border-white/10 bg-[#141416] px-5 py-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400" dangerouslySetInnerHTML={{ __html: item.a }} />
            </details>
          ))}
        </div>
      </section>

      {related.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Keep going</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {related.map((href) => (
              <li key={href}>
                <a href={relatedHref(href)} className="text-zinc-300 hover:text-white">
                  {relatedLabel(href)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="mt-14 rounded-3xl border border-white/10 bg-[#141416] px-6 py-10 text-center">
        <h2 className="text-2xl font-semibold">Run this in Superfocus</h2>
        <p className="mt-2 text-zinc-400">
          One plan. $1.99/month. Timer lives at /app after you subscribe.
        </p>
        <div className="mt-6">
          <ViewPricingLink />
        </div>
      </section>
    </main>
  );
}

export function HubList({
  title,
  intro,
  pages,
}: {
  title: string;
  intro: string;
  pages: PseoPage[];
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-lg text-zinc-400">{intro}</p>
      <ul className="mt-10 space-y-4">
        {pages.map((page) => (
          <li key={page.slug} className="rounded-2xl border border-white/10 bg-[#141416] p-5">
            <a href={pagePath(page)} className="text-lg font-semibold hover:text-white">
              {page.h1}
            </a>
            <p className="mt-2 text-sm text-zinc-400">{page.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
