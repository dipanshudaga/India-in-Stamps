import Link from "next/link";
import { notFound } from "next/navigation";

import { Arrow, Lotus, Sun, fishStrip } from "@/components/site/art";
import { WayCard } from "@/components/site/cards";
import { StampArt } from "@/components/site/frame";
import { getHome } from "@/lib/home-data";
import { isTheme } from "@/lib/themes";

export default async function Home({ params }: PageProps<"/[theme]">) {
  const { theme } = await params;
  if (!isTheme(theme)) notFound();
  const { total, hero, decades } = getHome();
  const n = total.toLocaleString("en-IN");

  const cards = (
    <section className="mt-6 grid gap-6 md:grid-cols-2">
      <WayCard theme={theme} href="/decades" n="01" title="By decade" text="Nine chapters, from 1947 to today. One decade at a time." thumbs={decades[3].thumbs} tone={1} />
      <WayCard theme={theme} href="/archive" n="02" title="The archive" text={`All ${n} stamps. Filter by theme, or search by name.`} thumbs={decades[6].thumbs} tone={0} />
    </section>
  );
  const ctas = (cls = "") => (
    <div className={`flex flex-wrap gap-3 ${cls}`}>
      <Link href={`/${theme}/decades`} className="btn btn-solid">Journey by decade &rarr;</Link>
      <Link href={`/${theme}/archive`} className="btn btn-line">Open the archive</Link>
    </div>
  );

  /* ---------- A: Bengal Bazaar ---------- */
  if (theme === "a")
    return (
      <main className="px-5 pt-28 sm:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="panel tone-0 relative flex min-h-[560px] flex-col justify-between overflow-hidden p-8 sm:p-12">
            <Sun className="spin-slow absolute -top-10 -right-10 h-52 w-52 text-black/70 sm:h-64 sm:w-64" />
            <p className="label relative">डाक टिकट · 1947 &ndash; आज</p>
            <div className="relative">
              <h1 className="display rise text-[clamp(3.6rem,9vw,8.5rem)]">भारत की कहानी</h1>
              <p className="display rise mt-3 text-3xl sm:text-5xl" style={{ ["--i" as string]: 2 }}>
                The story of India, one stamp at a time.
              </p>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <Link href="/a/decades" className="btn bg-black text-white">Journey by decade &rarr;</Link>
              <Link href="/a/archive" className="btn border-[1.5px] border-black text-black hover:bg-black hover:text-white">Open the archive</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {hero.slice(0, 4).map((s, i) => (
              <StampArt key={s.id} stamp={s} tone={[1, 2, 3, 1][i]} drift={i % 2 === 1} className="rise" />
            ))}
          </div>
        </section>
        {cards}
      </main>
    );

  /* ---------- B: Mithila Wall ---------- */
  if (theme === "b")
    return (
      <main className="px-5 pt-28 sm:px-10">
        <section className="panel mx-auto max-w-6xl px-6 py-14 text-center sm:px-16 sm:py-20">
          <div className="mx-auto mb-8 h-11 max-w-md" style={{ backgroundImage: fishStrip, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%" }} aria-hidden />
          <p className="label text-accent">डाक टिकट · 1947 &ndash; आज · {n} stamps</p>
          <h1 className="display rise mt-5 text-[clamp(3.4rem,9vw,8rem)]">भारत की कहानी</h1>
          <p className="display rise mx-auto mt-3 max-w-3xl text-3xl text-ink-2 sm:text-5xl" style={{ ["--i" as string]: 2 }}>
            The story of India, told in stamps.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-5">
            {hero.slice(1, 4).map((s, i) => (
              <StampArt key={s.id} stamp={s} tone={i} drift={i === 1} className="rise" />
            ))}
          </div>
          {ctas("mt-12 justify-center")}
          <div className="mx-auto mt-10 h-11 max-w-md" style={{ backgroundImage: fishStrip, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%" }} aria-hidden />
        </section>
        {cards}
      </main>
    );

  /* ---------- C: Bold Poster ---------- */
  return (
    <main className="overflow-hidden px-5 pt-28 sm:px-10">
      <section className="relative grid min-h-[640px] gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative">
          <div className="absolute top-8 left-[38%] h-[36vw] max-h-[380px] w-[36vw] max-w-[380px] rounded-full bg-[var(--pink)]" aria-hidden />
          <h1 className="display relative text-[clamp(6rem,19vw,16.5rem)] leading-[0.84] tracking-tight">
            <span className="rise block">1947</span>
            <span className="rise block text-accent" style={{ ["--i" as string]: 2 }}>2026</span>
          </h1>
          <Arrow className="absolute top-[36%] left-[1%] w-[22%] text-white sm:w-[16%]" />
          <p className="display relative mt-6 max-w-xl text-3xl sm:text-4xl">
            Every stamp India has issued. <span className="text-accent">भारत की कहानी।</span>
          </p>
          {ctas("relative mt-8")}
        </div>
        <div className="relative hidden lg:block">
          {hero.slice(0, 3).map((s, i) => (
            <div key={s.id} className="absolute w-[55%]" style={{ top: `${i * 24}%`, left: `${i % 2 ? 40 : 4}%`, zIndex: 3 - i }}>
              <StampArt stamp={s} tone={[1, 0, 2][i]} drift={i === 1} className="rise" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 lg:hidden">
          {hero.slice(0, 3).map((s, i) => (
            <StampArt key={s.id} stamp={s} tone={[1, 0, 2][i]} />
          ))}
        </div>
      </section>
      <section className="mt-10 grid md:grid-cols-2">
        <Link href="/c/decades" className="panel tone-1 group relative flex min-h-[320px] flex-col justify-between overflow-hidden p-8 sm:p-12">
          <Lotus className="absolute right-6 bottom-0 w-48 opacity-90 transition-transform duration-500 group-hover:-translate-y-2 sm:w-64" />
          <span className="label">01</span>
          <span className="display text-6xl sm:text-8xl">Decades <span className="inline-block transition-transform duration-500 group-hover:translate-x-3">&rarr;</span></span>
        </Link>
        <Link href="/c/archive" className="panel tone-0 group relative flex min-h-[320px] flex-col justify-between overflow-hidden p-8 sm:p-12">
          <Sun className="absolute right-4 bottom-4 w-44 text-black/80 transition-transform duration-[2s] group-hover:rotate-90 sm:w-56" />
          <span className="label">02</span>
          <span className="display text-6xl sm:text-8xl">Archive <span className="inline-block transition-transform duration-500 group-hover:translate-x-3">&rarr;</span></span>
        </Link>
      </section>
    </main>
  );
}
