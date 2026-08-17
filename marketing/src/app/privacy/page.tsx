import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Superfocus",
  description:
    "How Superfocus collects, uses, and protects data when you use the pomodoro timer and focus app.",
  alternates: { canonical: "https://www.superfocus.live/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="prose-article mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Effective date: September 22, 2025</strong>
      </p>
      <p>
        Superfocus (“us”, “we”, or “our”) operates https://www.superfocus.live (the “Service”), including the
        marketing site and the timer app at /app.
      </p>
      <p>
        This page explains what we collect when you create an account, subscribe, or use the pomodoro timer —
        and the choices you have. Terms of use are on <a href="/terms/">Terms</a>.
      </p>
      <h2>Information we collect</h2>
      <h3>Account and billing</h3>
      <p>
        If you sign in with Clerk we receive identifiers needed to keep you logged in (such as user id and
        email). If you subscribe, Stripe processes payment details. We do not store full card numbers on our
        servers.
      </p>
      <h3>Usage data</h3>
      <p>
        We may collect technical logs (IP address, browser type, pages visited, timestamps) to operate, debug,
        and prevent abuse of the Service. Focus session analytics in the app exist so you can see your own
        completed blocks.
      </p>
      <h3>Cookies</h3>
      <p>
        We use session, preference, and security cookies (including authentication). You can block cookies in
        the browser; some features will stop working.
      </p>
      <h2>How we use data</h2>
      <ul>
        <li>Provide and maintain the timer, tasks, cassettes, and account</li>
        <li>Process subscriptions and send transactional email</li>
        <li>Detect, prevent, and fix technical or security issues</li>
        <li>Understand aggregate usage so we can improve Superfocus</li>
      </ul>
      <h2>Processors</h2>
      <p>
        We use vendors who only see data needed to do their job: hosting (Vercel), auth (Clerk), payments
        (Stripe), email (Resend), and optional datastore for account/session features. They are not allowed to
        sell your data for their own marketing.
      </p>
      <h2>Transfers and security</h2>
      <p>
        Data may be processed in the United States or other countries where our processors operate. No method
        of transmission is perfectly secure; we use industry-standard protections and still cannot guarantee
        absolute security.
      </p>
      <h2>Legal requests</h2>
      <p>
        We may disclose information if required by law or to protect Superfocus, our users, or the public from
        harm or liability.
      </p>
      <h2>Changes</h2>
      <p>
        We will post updates on this page and change the effective date. Continued use after an update means
        you accept the revised policy. Questions: use the contact options on the site.
      </p>
    </main>
  );
}
