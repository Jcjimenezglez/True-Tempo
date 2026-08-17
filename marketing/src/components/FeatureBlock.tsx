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
  points: readonly string[];
  image: string;
  alt: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${reverse ? "md:[&>div:first-child]:order-2" : ""}`}
    >
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">{description}</p>
        <ul className="mt-5 space-y-2 text-sm text-zinc-300">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-white">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="overflow-hidden rounded-xl">
        <img src={image} alt={alt} className="h-auto w-full" />
      </div>
    </div>
  );
}
