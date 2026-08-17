"use client";

import { useState } from "react";

const SIGN_IN =
  "https://accounts.superfocus.live/sign-in?redirect_url=" +
  encodeURIComponent("https://www.superfocus.live/pricing?checkout=1");

function planType() {
  try {
    const meta = window.Clerk?.user?.publicMetadata || {};
    if (meta.isLifetime === true || meta.paymentType === "lifetime") return "lifetime";
    if (meta.isPremium === true || meta.isPro === true) return "premium";
  } catch {
    return "guest";
  }
  return window.Clerk?.user ? "free" : "guest";
}

export default function SubscribeButton({
  label = "Subscribe",
  className = "",
  id,
}: {
  label?: string;
  className?: string;
  id?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (window.Clerk && !window.Clerk.loaded) {
        await window.Clerk.load();
      }
      const user = window.Clerk?.user;
      const type = planType();
      if (type === "premium" || type === "lifetime") {
        window.location.href = "/app";
        return;
      }
      if (!user) {
        window.location.href = SIGN_IN;
        return;
      }

      const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
      const userId = user.id || "";
      let adsClickIds = null;
      try {
        adsClickIds = JSON.parse(localStorage.getItem("ads_click_ids") || "null");
      } catch {
        adsClickIds = null;
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-userid": userId,
        },
        body: JSON.stringify({
          planType: "monthly",
          userEmail,
          userId,
          adsClickIds,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Could not start checkout. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        className ||
        "rounded-full bg-white px-6 py-3 text-base font-semibold text-black shadow-[0_0_24px_rgba(255,255,255,0.16)] hover:bg-zinc-200 disabled:opacity-60"
      }
    >
      {busy ? "Loading..." : label}
    </button>
  );
}
