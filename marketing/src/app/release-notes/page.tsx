import fs from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Release Notes — Superfocus Pomodoro Timer",
  description:
    "What shipped in Superfocus: Todoist, analytics, streaks, and timer fixes. Premium is $1.99/month after a 7-day trial.",
  alternates: { canonical: "https://www.superfocus.live/release-notes" },
};

type Release = {
  version: string;
  date: string;
  sections?: Record<string, string[]>;
};

function loadReleases(): Release[] {
  const filePath = path.join(process.cwd(), "..", "release-notes.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return data.releases || [];
}

export default function ReleaseNotesPage() {
  const releases = loadReleases();
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1 className="text-4xl font-semibold tracking-tight">Release notes</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Product changes for the Superfocus timer. Guides stay free to read. The timer at /app is
        Premium — $1.99/month after a 7-day trial. No free plan.
      </p>
      <div className="mt-10 space-y-10">
        {releases.map((release) => (
          <article key={release.version} className="rounded-2xl border border-white/10 bg-[#141416] p-6">
            <h2 className="text-2xl font-semibold">{release.version}</h2>
            <p className="mt-1 text-sm text-zinc-500">{release.date}</p>
            {Object.entries(release.sections || {})
              .filter(([, items]) => items?.length)
              .map(([type, items]) => (
                <section key={type} className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{type}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-zinc-500">
        Questions:{" "}
        <a href="/contact/" className="underline">
          contact
        </a>
        .
      </p>
    </main>
  );
}
