import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Superfocus — Support & Billing",
  description:
    "Email support@superfocus.live for timer, billing, or account questions. Superfocus Premium is $1.99/month after a 7-day trial. No free plan.",
  alternates: { canonical: "https://www.superfocus.live/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1 className="text-4xl font-semibold tracking-tight">Contact Superfocus</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Questions about the pomodoro timer, checkout, or an existing subscription go to one inbox.
        We typically reply within one business day.
      </p>

      <section className="mt-10 rounded-2xl border border-white/10 bg-[#141416] p-6">
        <h2 className="text-xl font-semibold">Email</h2>
        <p className="mt-3 text-zinc-300">
          <a href="mailto:support@superfocus.live" className="text-white underline">
            support@superfocus.live
          </a>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Include the email on the Stripe receipt if the question is about billing.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Before you write</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-300">
          <li>
            Pricing is one plan: <strong>$1.99/month after a 7-day trial</strong>. There is no free
            plan and no guest timer.{" "}
            <a href="/pricing/" className="underline">
              Pricing
            </a>
            .
          </li>
          <li>
            “Is it free?” is answered on{" "}
            <a href="/faq/is-superfocus-free/" className="underline">
              Is Superfocus free?
            </a>
            .
          </li>
          <li>
            How to run a session:{" "}
            <a href="/faq/how-to-focus/" className="underline">
              How to focus
            </a>{" "}
            and{" "}
            <a href="/faq/pomodoro-timer-online/" className="underline">
              Pomodoro timer online
            </a>
            .
          </li>
        </ul>
      </section>
    </main>
  );
}
