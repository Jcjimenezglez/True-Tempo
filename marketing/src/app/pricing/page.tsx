import AvatarStack from "@/components/AvatarStack";
import FeatureBlock from "@/components/FeatureBlock";
import QuoteGrid from "@/components/QuoteGrid";
import SubscribeButton from "@/components/SubscribeButton";
import { productFeatures } from "@/lib/social-proof";

export default function PricingPage() {
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
        <p className="text-sm text-zinc-500">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Superfocus Premium</h1>
        <p className="mx-auto mt-4 max-w-md text-base text-zinc-400">
          One plan. $1.99/month. Then open the timer at /app.
        </p>
        <p className="mt-8 text-5xl font-semibold tracking-tight">
          $1.99<span className="text-lg font-medium text-zinc-500">/mo</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">Billed monthly. Cancel anytime.</p>
        <div className="mt-8">
          <SubscribeButton id="pricing-subscribe" autoCheckout />
        </div>
        <p className="mt-4 text-sm text-zinc-500">Account first, then Stripe Checkout.</p>
      </section>

      <AvatarStack />

      <section className="mx-auto max-w-5xl space-y-36 px-5 sm:space-y-44">
        {productFeatures.map((feature) => (
          <FeatureBlock key={feature.title} {...feature} />
        ))}
      </section>

      <QuoteGrid />

      <section className="mx-auto max-w-xl px-5 pb-32 pt-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Subscribe</h2>
        <p className="mt-3 text-zinc-400">$1.99/month. Cancel anytime.</p>
        <div className="mt-8">
          <SubscribeButton />
        </div>
      </section>
    </main>
  );
}
