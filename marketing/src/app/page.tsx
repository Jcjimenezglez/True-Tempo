import FeatureBlock from "@/components/FeatureBlock";
import ViewPricingLink from "@/components/ViewPricingLink";

const features = [
  {
    title: "Work in your own rhythm",
    description: "Pomodoro 25/5, short sprints, or longer deep work. Set the length you will actually finish.",
    points: ["Custom session lengths", "Breaks that match the block", "One task on the clock"],
    image: "/images/Timer.png",
    alt: "Superfocus pomodoro timer",
  },
  {
    title: "Keep the task next to the timer",
    description: "Stop bouncing between a list and a clock. Name the work, then start the session.",
    points: ["Tasks in the same tab", "Progress as you finish blocks", "Import from Todoist"],
    image: "/images/Tasks.png",
    alt: "Superfocus task list",
    reverse: true,
  },
  {
    title: "Sound without a second tab",
    description: "Lofi, rain, and cassettes stay inside Superfocus so YouTube does not steal the session.",
    points: ["Built-in cassettes", "Your own tracks", "Timer and audio together"],
    image: "/images/Cassettes.png",
    alt: "Superfocus focus cassettes",
  },
  {
    title: "See the blocks you finished",
    description: "Streaks and reports count completed sessions — not hours a tab sat open.",
    points: ["Focus history", "Patterns over time", "Optional leaderboard"],
    image: "/images/Report.png",
    alt: "Superfocus focus report",
    reverse: true,
  },
];

const people = [
  { name: "Nina", role: "Creator", image: "/images/lifestyle-blog.jpg" },
  { name: "David", role: "Ops", image: "/images/profiles/david.svg" },
  { name: "Sam", role: "Student", image: "/images/profiles/sam.svg" },
  { name: "Alex", role: "Freelance", image: "/images/profiles/alex.svg" },
  { name: "Maya", role: "Writer", image: "/images/profiles/maya.svg" },
];

const quotes = [
  {
    quote: "I need to focus during precise hours. Superfocus helps me stay on track.",
    name: "Nina",
    role: "Life with Chevy",
    image: "/images/lifestyle-blog.jpg",
  },
  {
    quote: "Blocking two pomodoros in the morning changed my day.",
    name: "David",
    role: "Ops",
    image: "/images/profiles/david.svg",
  },
  {
    quote: "Tried a bunch of apps. The 25-minute block actually sticks.",
    name: "Sam",
    role: "Law student",
    image: "/images/profiles/sam.svg",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-5 pb-10 pt-16 text-center sm:pt-20">
        <p className="text-sm text-zinc-500">Pomodoro timer</p>
        <h1 className="mx-auto mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          One tab. One task. Done.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
          Timer, tasks, and sound together. $1.99/month.
        </p>
        <div className="mt-7">
          <ViewPricingLink />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5">
        <img
          src="/images/Timer.png"
          alt="Superfocus pomodoro timer in the browser"
          className="h-auto w-full rounded-xl"
        />
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        <div className="flex items-center justify-center">
          {people.map((person, index) => (
            <img
              key={person.name}
              src={person.image}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[#0b0b0c]"
              style={{ marginLeft: index === 0 ? 0 : -10 }}
            />
          ))}
        </div>
        <p className="mt-5 text-sm text-zinc-400">
          Used by 5,050+ people who need to finish the block — not collect another app.
        </p>
      </section>

      <section className="mx-auto max-w-5xl space-y-28 px-5 pb-8">
        {features.map((feature) => (
          <FeatureBlock key={feature.title} {...feature} />
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24">
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {quotes.map((item) => (
            <figure key={item.name}>
              <blockquote className="text-base leading-relaxed text-zinc-300">“{item.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 text-sm">
                <img
                  src={item.image}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <span>
                  <span className="font-semibold text-white">{item.name}</span>
                  <span className="block text-zinc-500">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-xl px-5 pb-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Start a session</h2>
        <p className="mt-3 text-zinc-400">$1.99/month. Cancel anytime.</p>
        <div className="mt-6">
          <ViewPricingLink />
        </div>
      </section>
    </main>
  );
}
