import Link from "next/link";
import { notFound } from "next/navigation";

import { DecadeGrid } from "@/components/site/grid";
import { SpotlightPicker } from "@/components/site/spotlight";
import { getDecade, getDecadeKeys, getDecades } from "@/lib/home-data";
import { THEME_KEYS, isTheme } from "@/lib/themes";

export const generateStaticParams = () =>
  THEME_KEYS.flatMap((theme) => getDecadeKeys().map((key) => ({ theme, key: String(key) })));

export async function generateMetadata({ params }: PageProps<"/[theme]/decades/[key]">) {
  const { key } = await params;
  const d = getDecade(Number(key));
  return { title: d ? `The ${d.label}` : "Decade" };
}

export default async function DecadePage({ params }: PageProps<"/[theme]/decades/[key]">) {
  const { theme, key } = await params;
  if (!isTheme(theme)) notFound();
  const d = getDecade(Number(key));
  if (!d) notFound();
  const all = getDecades();

  return (
    <main className="px-5 pt-32 sm:px-10">
      <Link href={`/${theme}/decades`} className="label text-ink-3 transition-colors hover:text-accent">&larr; All decades</Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-8">
        <h1 className="display text-[clamp(6rem,22vw,20rem)] leading-[0.82]">{d.label}</h1>
        <div className="max-w-sm pb-3">
          <p className="label text-accent">{d.count.toLocaleString("en-IN")} stamps</p>
          {d.themes.length > 0 && <p className="mt-3 text-lg text-ink-2">Recurring themes: {d.themes.join(", ").toLowerCase()}.</p>}
        </div>
      </header>

      <nav aria-label="Decades" className="mt-10 flex flex-wrap gap-2">
        {all.map((x) => (
          <Link
            key={x.key}
            href={`/${theme}/decades/${x.key}`}
            aria-current={x.key === d.key ? "true" : undefined}
            className={`label rounded-full border px-4 py-2 transition-colors ${x.key === d.key ? "border-accent bg-accent text-black" : "border-white/15 text-ink-2 hover:border-white/40 hover:text-ink"}`}
          >
            {x.short}
          </Link>
        ))}
      </nav>

      <div className="mt-20">
        <SpotlightPicker key={d.key} items={d.spotlight} />
      </div>

      <section className="mt-28">
        <p className="label mb-8 text-ink-3">Every stamp of the {d.label}</p>
        <DecadeGrid key={d.key} stamps={d.stamps} />
      </section>

      <nav className="mt-24 flex items-center justify-between border-t border-white/10 pt-8">
        {d.prev ? (
          <Link href={`/${theme}/decades/${d.prev.key}`} className="display text-4xl transition-colors hover:text-accent sm:text-5xl">&larr; {d.prev.label}</Link>
        ) : <span />}
        {d.next ? (
          <Link href={`/${theme}/decades/${d.next.key}`} className="display text-4xl transition-colors hover:text-accent sm:text-5xl">{d.next.label} &rarr;</Link>
        ) : (
          <Link href={`/${theme}/archive`} className="display text-4xl transition-colors hover:text-accent sm:text-5xl">The archive &rarr;</Link>
        )}
      </nav>
    </main>
  );
}
