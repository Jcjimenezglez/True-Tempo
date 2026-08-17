"use client";

import { useEffect } from "react";
import SubscribeButton from "@/components/SubscribeButton";

const included = [
  {
    title: "Pomodoro timer in the browser",
    detail: "Classic 25/5, Sprint, Flow, Deep Work, or your own lengths. No download.",
  },
  {
    title: "Unlimited sessions",
    detail: "No daily cap once you subscribe. Start as many blocks as you need.",
  },
  {
    title: "Tasks next to the clock",
    detail: "Name one outcome per session. Import from Todoist if you already plan there.",
  },
  {
    title: "Sound in the same tab",
    detail: "Cassettes, lofi, rain, or Spotify — so you do not open a second YouTube tab.",
  },
  {
    title: "Reports and streaks",
    detail: "See finished blocks, not hours a tab sat open. Optional leaderboard.",
  },
];

const steps = [
  "Create an account (or log in).",
  "Pay $1.99/month in Stripe Checkout.",
  "Open the timer at /app and start a session.",
];

const faqs = [
  {
    q: "How much does Superfocus cost?",
    a: "One plan: $1.99 per month, billed by Stripe. Taxes may apply depending on your location. There is no annual plan on this page.",
  },
  {
    q: "What do I get after I pay?",
    a: "Full access to the timer app at /app: unlimited sessions, custom timers, tasks, cassettes, Todoist, analytics, and the leaderboard.",
  },
  {
    q: "Is there a free or guest timer?",
    a: "No guest clock on the marketing site. You create an account, subscribe, then use /app. Some referral links still unlock a 90-day trial — the checkout page will show that if it applies.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, anytime. You keep Premium until the end of the period you already paid. We do not prorate unused days.",
  },
  {
    q: "I already have an account",
    a: "Log in, then subscribe here if you are not Premium yet. If you already pay, go straight to /app.",
  },
  {
    q: "Where does the money go?",
    a: "Checkout is Stripe. Superfocus never stores your full card number. Auth is Clerk.",
  },
];

export default function PricingPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "1") return;

    const start = Date.now();
    const timer = window.setInterval(() => {
      if (window.Clerk?.user) {
        window.clearInterval(timer);
        document.getElementById("pricing-subscribe")?.click();
      }
      if (Date.now() - start > 8000) {
        window.clearInterval(timer);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24">
      <section className="px-5 pt-16 text-center sm:pt-24">
        <p className="text-sm text-zinc-500">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Superfocus Premium</h1>
        <p className="mx-auto mt-4 max-w-md text-zinc-400">
          One plan. $1.99/month. Then open the timer at /app.
        </p>
        <p className="mt-8 text-5xl font-semibold tracking-tight">
          $1.99<span className="text-lg font-medium text-zinc-500">/mo</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">Billed monthly. Cancel anytime.</p>
        <div className="mt-8 flex justify-center">
          <SubscribeButton
            id="pricing-subscribe"
            label="Subscribe"
            className="rounded-full bg-white px-8 py-3 text-base font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
          />
        </div>
        <p className="mt-4 text-sm text-zinc-500">Account first, then Stripe Checkout.</p>
      </section>

      <section className="mt-28">
        <h2 className="text-2xl font-semibold tracking-tight">What is included</h2>
        <ul className="mt-8 space-y-6">
          {included.map((item) => (
            <li key={item.title}>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 list-decimal space-y-3 pl-5 text-zinc-300">
          {steps.map((step) => (
            <li key={step} className="pl-1 leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">Good to know</h2>
        <ul className="mt-8 space-y-3 text-sm leading-relaxed text-zinc-400">
          <li>Works in the browser on desktop. The product is /app after checkout.</li>
          <li>Spotify playback needs your own Spotify account where the app asks for it.</li>
          <li>Todoist import is optional. You can keep tasks only in Superfocus.</li>
          <li>Cancel anytime; access lasts through the paid month.</li>
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-8 space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
