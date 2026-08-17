import { people } from "@/lib/social-proof";

export default function AvatarStack() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-28 text-center sm:py-32">
      <div className="flex items-center justify-center">
        {people.map((person, index) => (
          <img
            key={person.name}
            src={person.image}
            alt={person.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-[#0b0b0c]"
            style={{ marginLeft: index === 0 ? 0 : -8 }}
          />
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-zinc-400">
        Used by 5,050+ people who need to finish the block — not collect another app.
      </p>
    </section>
  );
}
