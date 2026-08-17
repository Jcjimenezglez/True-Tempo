import ViewPricingLink from "@/components/ViewPricingLink";
import { BLOG_POSTS, getPost } from "@/lib/blog-posts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `https://www.superfocus.live/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keyword,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, images: ["/og-image.png"] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        <a href="/blog/" className="hover:text-white">
          Blog
        </a>
        <span> · {post.date}</span>
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-4 text-lg text-zinc-400">{post.description}</p>
      <figure className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <img src="/images/Timer.png" alt="Superfocus timer used during a focus block" className="h-auto w-full" />
      </figure>
      <article className="prose-article mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />
      <div className="mt-12 text-center">
        <ViewPricingLink />
      </div>
    </main>
  );
}
