import SubscribeButton from "@/components/SubscribeButton";

export default function ViewPricingLink({
  className = "rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60",
}: {
  className?: string;
}) {
  return <SubscribeButton label="Subscribe" className={className} />;
}
