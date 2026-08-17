"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Clerk?: {
      load: (opts?: Record<string, unknown>) => Promise<void>;
      loaded?: boolean;
      user?: {
        id: string;
        publicMetadata?: Record<string, unknown>;
        primaryEmailAddress?: { emailAddress?: string };
        emailAddresses?: { emailAddress?: string }[];
      } | null;
    };
  }
}

const CLERK_KEY = "pk_live_Y2xlcmsuc3VwZXJmb2N1cy5saXZlJA";

export default function ClerkLoader() {
  useEffect(() => {
    if (window.Clerk) {
      window.Clerk.load().catch(() => {});
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-clerk-publishable-key", CLERK_KEY);
    script.onload = () => {
      window.Clerk?.load({ isSatellite: false }).catch(() => {});
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
