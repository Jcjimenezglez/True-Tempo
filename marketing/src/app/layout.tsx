import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ClerkLoader from "@/components/ClerkProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.superfocus.live"),
  title: "Pomodoro Timer Online — Focus & Study Timer | Superfocus",
  description:
    "Pomodoro timer, tasks, and lofi cassettes in one browser tab. Superfocus Premium is $1.99/month.",
  keywords: [
    "pomodoro timer",
    "pomodoro technique",
    "pomodoro method",
    "pomodoro timer online",
    "tomato timer",
    "study timer",
    "focus timer",
    "focus music",
    "how to focus",
  ],
  openGraph: {
    title: "Pomodoro Timer Online — Superfocus",
    description: "Timer, tasks, and cassettes in one focus workflow.",
    url: "https://www.superfocus.live/",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} min-h-screen bg-background antialiased`}>
        <ClerkLoader />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
