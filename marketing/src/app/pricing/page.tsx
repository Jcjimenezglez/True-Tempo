"use client";

import { useEffect } from "react";
import SubscribeButton from "@/components/SubscribeButton";

const faqs = [
  {
    q: "How much does Superfocus cost?",
    a: "Premium is $1.99 per month. Create an account, then pay in Stripe Checkout. Cancel anytime.",
  },
  {
    q: "What is included?",
    a: "The timer app at /app: unlimited pomodoro sessions, tasks, cassettes, Todoist, and analytics.",
  },
  {
    q: "I already have an account",
    a: "Log in, then subscribe if you are not Premium yet. If you already pay, open /app.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Access stays through the end of the billing period.",
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
    <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
      <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Pricing</p>
      <h1 className="mt-3 text-center text-4xl font-semibold tracking-tight">Superfocus Premium</h1>
      <p className="mt-3 text-center text-zinc-400">One plan. The timer app is at /app after you subscribe.</p>

      <div className="mt-10 rounded-3xl border border-white/10 bg-[#141416] p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Billed monthly</p>
            <p className="mt-1 text-5xl font-semibold">
              $1.99<span className="text-lg font-medium text-zinc-500">/mo</span>
            </p>
          </div>
        </div>
        <ul className="mt-6 space-y-2 text-sm text-zinc-300">
          {[
            "Pomodoro timer in the browser",
            "Unlimited focus sessions",
            "Unlimited tasks",
            "Cassettes and soundtracks",
            "Todoist integration",
            "Analytics",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <SubscribeButton
            id="pricing-subscribe"
            label="Subscribe"
            className="w-full rounded-full bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
          />
        </div>
        <p className="mt-3 text-center text-sm text-zinc-500">
          Create an account, then pay in Stripe Checkout. Cancel anytime.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {faqs.map((item) => (
          <details key={item.q} className="rounded-2xl border border-white/10 bg-[#141416] px-5 py-4">
            <summary className="cursor-pointer list-none font-medium">{item.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
