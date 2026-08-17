export default function FeatureBlock({
  title,
  description,
  points,
  image,
  alt,
  reverse = false,
}: {
  title: string;
  description: string;
  points: string[];
  image: string;
  alt: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-8 md:grid-cols-2 ${reverse ? "md:[&>div:first-child]:order-2" : ""}`}
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-3 text-zinc-400">{description}</p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-white">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
        <img src={image} alt={alt} className="h-auto w-full" />
      </div>
    </div>
  );
}
