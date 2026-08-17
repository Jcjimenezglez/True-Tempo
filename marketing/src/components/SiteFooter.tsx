export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm text-zinc-400 sm:grid-cols-4">
        <div>
          <p className="font-semibold text-white">Product</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/" className="hover:text-white">
              Home
            </a>
            <a href="/pricing/" className="hover:text-white">
              Pricing
            </a>
            <a href="/blog/" className="hover:text-white">
              Blog
            </a>
            <a href="/techniques/pomodoro-technique/" className="hover:text-white">
              Pomodoro technique
            </a>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Explore</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/techniques/" className="hover:text-white">
              Techniques
            </a>
            <a href="/use-cases/" className="hover:text-white">
              Use cases
            </a>
            <a href="/compare/" className="hover:text-white">
              Compare
            </a>
            <a href="/alternatives/" className="hover:text-white">
              Alternatives
            </a>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Popular</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/use-cases/study-timer/" className="hover:text-white">
              Study timer
            </a>
            <a href="/use-cases/focus-timer/" className="hover:text-white">
              Focus timer
            </a>
            <a href="/compare/superfocus-vs-pomofocus/" className="hover:text-white">
              vs Pomofocus
            </a>
            <a href="/blog/why-cant-i-focus/" className="hover:text-white">
              Why can&apos;t I focus
            </a>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Legal</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/privacy/" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms/" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs text-zinc-600">© 2026 Superfocus</p>
    </footer>
  );
}
