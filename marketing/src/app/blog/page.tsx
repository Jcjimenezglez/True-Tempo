import ViewPricingLink from "@/components/ViewPricingLink";
import { BLOG_POSTS } from "@/lib/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Pomodoro, Study Timer & Focus Guides | Superfocus",
  description:
    "Guides on the pomodoro technique, why you can't focus, study timers, Pomofocus comparisons, and ADHD-friendly short blocks.",
  alternates: { canonical: "https://www.superfocus.live/blog/" },
};

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <h1 className="text-4xl font-semibold tracking-tight">Superfocus Blog</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Practical writing on pomodoro timers, study sessions, and why focus fails — aimed at finished
        blocks, not another productivity religion.
      </p>
      <ul className="mt-10 space-y-4">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="rounded-2xl border border-white/10 bg-[#141416] p-5">
            <p className="text-xs text-zinc-500">{post.date}</p>
            <a href={`/blog/${post.slug}/`} className="mt-1 block text-lg font-semibold hover:text-white">
              {post.title}
            </a>
            <p className="mt-2 text-sm text-zinc-400">{post.description}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <ViewPricingLink />
      </div>
    </main>
  );
}
