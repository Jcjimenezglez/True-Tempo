export default function SiteHeader({
  ctaHref = "/pricing/",
  ctaLabel = "View pricing",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:grid-cols-3">
        <a href="/" className="flex items-center gap-2 justify-self-start font-semibold tracking-tight">
          <img src="/superfocus-logo-white.png" alt="" className="h-7 w-7" />
          Superfocus
        </a>
        <nav
          className="hidden items-center justify-center gap-6 justify-self-center text-sm text-zinc-300 sm:flex"
          aria-label="Site"
        >
          <a href="/" className="hover:text-white">
            Home
          </a>
          <a href="/blog/" className="hover:text-white">
            Blog
          </a>
          <a href="/techniques/" className="hover:text-white">
            Techniques
          </a>
          <a href="/pricing/" className="hover:text-white">
            Pricing
          </a>
        </nav>
        <nav className="flex items-center gap-4 justify-self-end text-sm text-zinc-300" aria-label="Account">
          <a
            href="https://accounts.superfocus.live/sign-in?redirect_url=https%3A%2F%2Fwww.superfocus.live%2Fapp"
            className="hover:text-white"
          >
            Log in
          </a>
          <a
            href={ctaHref}
            className="rounded-full bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200"
          >
            {ctaLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
