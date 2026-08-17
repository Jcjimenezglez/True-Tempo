export default function ViewPricingLink({
  className = "rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200",
}: {
  className?: string;
}) {
  return (
    <a href="/pricing/" className={className}>
      View pricing
    </a>
  );
}
