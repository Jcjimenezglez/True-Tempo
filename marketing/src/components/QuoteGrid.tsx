import { quotes } from "@/lib/social-proof";

export default function QuoteGrid() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-28 sm:py-36">
      <div className="grid gap-16 md:grid-cols-3 md:gap-12">
        {quotes.map((item) => (
          <figure key={item.name}>
            <blockquote className="text-base leading-relaxed text-zinc-300">“{item.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm">
              <img src={item.image} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              <span>
                <span className="font-semibold text-white">{item.name}</span>
                <span className="block text-zinc-500">{item.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
