import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Superfocus Premium $1.99/month",
  description:
    "Superfocus Premium is $1.99/month. Unlimited pomodoro sessions, tasks, cassettes, Todoist, analytics. Cancel anytime.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
