import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Superfocus",
  description: "Terms for using the Superfocus website, pomodoro timer, and Premium subscription.",
  alternates: { canonical: "https://www.superfocus.live/terms" },
};

export default function TermsPage() {
  return (
    <main className="prose-article mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1>Terms and Conditions</h1>
      <p>
        <strong>Last updated: September 22, 2025</strong>
      </p>
      <p>
        By using https://www.superfocus.live, creating an account, or subscribing to Superfocus Premium, you
        agree to these terms. If you do not agree, do not use the Service.
      </p>
      <h2>The Service</h2>
      <p>
        Superfocus provides a browser pomodoro / focus timer, tasks, optional sound cassettes, and related
        features. Marketing pages (guides, blog, techniques) are informational. The timer product lives at
        /app after you subscribe.
      </p>
      <h2>Accounts and billing</h2>
      <p>
        Premium is billed at $1.99 per month through Stripe unless we state otherwise. Cancel anytime; access
        continues until the end of the paid period. You are responsible for keeping login credentials safe.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Use Superfocus for lawful personal or internal work purposes.</li>
        <li>Do not reverse-engineer, scrape in an abusive way, or attack the Service.</li>
        <li>Do not use the Service to violate other people’s rights or applicable law.</li>
      </ul>
      <h2>Intellectual property</h2>
      <p>
        Superfocus branding, product UI, and original writing on this site belong to us. You keep rights to
        content you type into your own tasks.
      </p>
      <h2>Disclaimer and liability</h2>
      <p>
        The Service is provided “as is.” Focus guides are not medical, legal, or academic advice. To the
        fullest extent allowed by law, Superfocus is not liable for indirect, incidental, or consequential
        damages, including lost profits or data, arising from use or inability to use the Service.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms by posting a new version on this page. Continued use after the update
        constitutes acceptance.
      </p>
    </main>
  );
}
