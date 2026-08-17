export default function SiteHeader({
  ctaHref = "/pricing/",
  ctaLabel = "View pricing",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/superfocus-logo-white.png" alt="" className="h-7 w-7" />
          Superfocus
        </a>
        <div className="flex items-center gap-10 text-sm text-zinc-300 sm:gap-14">
          <nav className="flex items-center gap-5" aria-label="Site">
            <a href="/" className="hidden sm:inline hover:text-white">
              Home
            </a>
            <a href="/blog/" className="hidden sm:inline hover:text-white">
              Blog
            </a>
            <a href="/techniques/" className="hidden md:inline hover:text-white">
              Techniques
            </a>
            <a href="/pricing/" className="hover:text-white">
              Pricing
            </a>
          </nav>
          <nav className="flex items-center gap-4" aria-label="Account">
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
      </div>
    </header>
  );
}
