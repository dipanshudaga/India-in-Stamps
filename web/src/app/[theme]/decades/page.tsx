import { notFound } from "next/navigation";

import { DecadeCard } from "@/components/site/cards";
import { getDecades } from "@/lib/home-data";
import { isTheme } from "@/lib/themes";

export const metadata = { title: "Decades" };

export default async function Decades({ params }: PageProps<"/[theme]/decades">) {
  const { theme } = await params;
  if (!isTheme(theme)) notFound();
  const decades = getDecades();
  return (
    <main className="px-5 pt-32 sm:px-10">
      <p className="label text-accent">1947 &ndash; today</p>
      <h1 className="display mt-4 text-[clamp(4rem,11vw,9rem)]">By decade</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-2">Nine chapters of Indian postage. Pick one and read it like a story.</p>
      <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {decades.map((d, i) => (
          <DecadeCard key={d.key} theme={theme} d={d} i={i} />
        ))}
      </div>
    </main>
  );
}
