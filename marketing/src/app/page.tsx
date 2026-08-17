import FeatureBlock from "@/components/FeatureBlock";
import ViewPricingLink from "@/components/ViewPricingLink";

const features = [
  {
    title: "Custom work rhythms",
    description:
      "Not everyone focuses the same way. Stop forcing the 25-minute mold when you need sprints or deep work.",
    points: ["Work in your natural rhythm", "Unlimited custom durations", "Deep work or quick bursts"],
    image: "/images/Timer.png",
    alt: "Pomodoro timer with custom work and break lengths",
  },
  {
    title: "Organized projects",
    description: "Stop juggling tasks in your head. Break goals into focused chunks and track them as you go.",
    points: ["Break big goals into sessions", "Track progress automatically", "Keep every task in one list"],
    image: "/images/Tasks.png",
    alt: "Task list with pomodoro estimates",
    reverse: true,
  },
  {
    title: "Todoist integration",
    description: "Import Todoist tasks into Superfocus and keep them in sync while you run the timer.",
    points: ["Import from Todoist projects", "Two-way sync", "Focus on one task at a time"],
    image: "/images/todoist-import-modal.png",
    alt: "Import tasks from Todoist",
  },
  {
    title: "Perfect focus atmosphere",
    description: "Lofi, rain, and custom cassettes so you do not need a second tab for sound.",
    points: ["Custom focus zones", "Your music or ambient beds", "Visual plus audio triggers"],
    image: "/images/Cassettes.png",
    alt: "Focus cassettes with ambient sounds",
    reverse: true,
  },
  {
    title: "See your real progress",
    description: "Analytics and streaks that show whether you actually focused — not just opened the app.",
    points: ["Track focus streaks", "See patterns over time", "Celebrate finished blocks"],
    image: "/images/Report.png",
    alt: "Focus analytics report",
  },
  {
    title: "Stay accountable",
    description: "A leaderboard for people who protect deep work instead of collecting unused productivity apps.",
    points: ["Global leaderboard", "Compare focus time", "Build a streak with others"],
    image: "/images/Leaderboard.png",
    alt: "Superfocus leaderboard",
    reverse: true,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pt-24">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Pomodoro timer (90k+ US/mo) · pomodoro technique · study timer · focus timer
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          You&apos;re paying for three apps. Still can&apos;t focus.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Timer in one tab. Music in another. Tasks somewhere else. Superfocus puts a pomodoro timer, cassettes,
          tasks, and analytics in one workflow — so you finish work instead of managing apps.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ViewPricingLink />
          <a
            href="/techniques/pomodoro-technique/"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            Pomodoro technique
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-500">$1.99 per month. Cancel anytime.</p>
        <figure className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#141416] text-left">
          <img
            src="/images/Timer.png"
            alt="Superfocus pomodoro timer showing a focus session in the browser"
            className="h-auto w-full"
          />
          <figcaption className="px-4 py-3 text-sm text-zinc-500">
            The Superfocus timer — pomodoro clock, one task, optional cassette audio in a single tab.
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-2xl border border-white/10 bg-[#141416] px-6 py-8 text-center">
          <h2 className="text-xl font-semibold">Trusted by people who need focused execution</h2>
          <p className="mt-2 text-zinc-400">
            Creators, freelancers, and operators use Superfocus to protect deep work blocks.
          </p>
          <p className="mt-4 text-sm text-zinc-500">Loved by 5,050+ users</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-20 px-5 pb-8">
        {features.map((feature) => (
          <FeatureBlock key={feature.title} {...feature} />
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              quote:
                "I need to focus during precise hours. Superfocus helps me stay on track and make real progress on my life project.",
              name: "Nina",
              role: "Life with Chevy",
            },
            {
              quote:
                "Back-to-back meetings all day. Blocking two pomodoros in the morning changed everything.",
              name: "David",
              role: "Ops",
            },
            {
              quote: "Tried a bunch of productivity apps. This one just works. The 25 min thing really does help.",
              name: "Sam",
              role: "Law student",
            },
          ].map((item) => (
            <figure key={item.name} className="rounded-2xl border border-white/10 bg-[#141416] p-5">
              <blockquote className="text-sm leading-relaxed text-zinc-300">“{item.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className="block text-zinc-500">{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 text-center">
        <h2 className="text-3xl font-semibold">Start the pomodoro timer</h2>
        <p className="mt-3 text-zinc-400">View pricing, subscribe, then open the app at /app. One plan. $1.99/month.</p>
        <div className="mt-6">
          <ViewPricingLink />
        </div>
      </section>
    </main>
  );
}
