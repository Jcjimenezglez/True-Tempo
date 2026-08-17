import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Superfocus Premium $1.99/month",
  description: "Superfocus Premium is $1.99/month. Pomodoro timer, tasks, cassettes, Todoist, and analytics.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
