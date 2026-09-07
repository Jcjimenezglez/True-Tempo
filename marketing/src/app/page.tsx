import AvatarStack from "@/components/AvatarStack";
import FeatureBlock from "@/components/FeatureBlock";
import QuoteGrid from "@/components/QuoteGrid";
import SubscribeButton from "@/components/SubscribeButton";
import { productFeatures } from "@/lib/social-proof";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-5 pt-10 sm:pt-14">
        <img
          src="/images/Superfocus.png"
          alt="Superfocus timer at 25:00 on a desert focus scene, sidebar closed"
          className="h-auto w-full rounded-xl"
        />
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-8 pt-16 text-center sm:pt-20">
        <p className="text-sm text-zinc-500">Pomodoro timer</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          One tab. One task. Done.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-zinc-400">
          Timer, tasks, and sound together. $1.99/month after a 7-day trial.
        </p>
        <div className="mt-8">
          <SubscribeButton />
        </div>
      </section>

      <AvatarStack />

      <section className="mx-auto max-w-5xl space-y-36 px-5 sm:space-y-44">
        {productFeatures.map((feature) => (
          <FeatureBlock key={feature.title} {...feature} />
        ))}
      </section>

      <QuoteGrid />

      <section className="mx-auto max-w-3xl px-5 pb-16 pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">Guides</h2>
        <p className="mt-3 text-zinc-400">
          Real HTML links to every live cluster hub. Premium is $1.99/month after a 7-day trial. No
          free plan.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["/techniques/", "Techniques"],
            ["/use-cases/", "Use cases"],
            ["/compare/", "Compare"],
            ["/alternatives/", "Alternatives"],
            ["/faq/", "FAQ"],
            ["/blog/", "Blog"],
            ["/sounds/", "Sounds"],
            ["/workflows/", "Workflows"],
            ["/analytics/", "Analytics"],
            ["/goals/", "Goals"],
            ["/professions/", "Professions"],
            ["/activities/", "Activities"],
            ["/pricing/", "Pricing"],
            ["/faq/how-to-focus/", "How to focus"],
            ["/use-cases/study-timer/", "Study timer"],
            ["/techniques/pomodoro-technique/", "Pomodoro technique"],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-zinc-300 hover:text-white">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-xl px-5 pb-32 pt-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Start a session</h2>
        <p className="mt-3 text-zinc-400">$1.99/month after a 7-day trial. Cancel anytime.</p>
        <div className="mt-8">
          <SubscribeButton />
        </div>
      </section>
    </main>
  );
}
