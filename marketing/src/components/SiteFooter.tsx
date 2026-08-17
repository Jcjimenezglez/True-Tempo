export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-400">
        <p>Superfocus</p>
        <div className="flex flex-wrap gap-4">
          <a href="/pricing/" className="hover:text-white">
            Pricing
          </a>
          <a href="/blog/" className="hover:text-white">
            Blog
          </a>
          <a href="/techniques/pomodoro-technique" className="hover:text-white">
            Pomodoro technique
          </a>
          <a href="/privacy" className="hover:text-white">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
