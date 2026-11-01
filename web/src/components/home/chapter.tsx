"use client";

import { useEffect, useRef, useState } from "react";

import type { Chapter as ChapterData, Lite } from "@/lib/home-data";

import { prefersReducedMotion, useDragScroll, useReveal } from "./hooks";
import { StampImg } from "./stamp-img";

type Open = (id: number, rect: DOMRect) => void;

// D: one full-screen chapter per decade.
//   1. a giant decade title, outlined and filled left-to-right by scroll
//   2. a spotlight: three well-documented stamps, big, with the catalog's own story (01 / 03)
//   3. a timeline strip: a line with a year marker wherever the year changes, every stamp hung off it
export function Chapter({
  chapter,
  stamps,
  next,
  onOpen,
}: {
  chapter: ChapterData;
  stamps: Lite[];
  next: string;
  onOpen: Open;
}) {
  const root = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const moved = useDragScroll(strip);
  const [spot, setSpot] = useState(0);
  useReveal(root);

  // --p: 0 -> 1 as the chapter enters (drives the title fill).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      el.style.setProperty("--p", Math.min(Math.max((vh - r.top) / (vh * 0.85), 0), 1).toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const count = chapter.end - chapter.start;
  const spots = chapter.spotlight;
  const current = spots[spot];
  const hero = stamps[current.i];
  const step = (d: number) => setSpot((n) => (n + d + spots.length) % spots.length);
  const items = stamps.slice(chapter.start, chapter.end);
  const openSpotlight = () => {
    const img = root.current?.querySelector<HTMLImageElement>(".spot-in img");
    if (img) onOpen(hero.id, img.getBoundingClientRect());
  };

  return (
    <section
      ref={root}
      id={`chapter-${chapter.key}`}
      className="relative flex min-h-svh flex-col gap-20 overflow-hidden px-5 pt-32 pb-24 sm:px-10"
      style={{ ["--p" as string]: 0 }}
    >
      {/* 1. Title */}
      <div className="relative">
        <h2 className="chapter-title select-none" aria-label={chapter.label}>
          <span className="chapter-outline" aria-hidden>
            {chapter.label}
          </span>
          <span className="chapter-fill" aria-hidden>
            {chapter.label}
          </span>
        </h2>
        <div className="reveal mt-4 max-w-md lg:absolute lg:right-0 lg:bottom-4" style={{ ["--d" as string]: "150ms" }}>
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
            {count.toLocaleString("en-IN")} stamps
          </p>
          <p className="mt-3 text-lg leading-snug text-ink-2">
            {chapter.themes.length > 0
              ? `Recurring themes: ${chapter.themes.join(", ").toLowerCase()}.`
              : "A handful of early issues."}
          </p>
        </div>
      </div>

      {/* 2. Spotlight */}
      <div className="reveal grid items-center gap-10 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,90,45,0.13),transparent_65%)]" />
          <button
            key={hero.id}
            type="button"
            aria-label={`Open ${hero.n}`}
            onClick={openSpotlight}
            className="spot-in group relative mx-auto block cursor-pointer"
          >
            <StampImg
              path={hero.p}
              variant="full"
              className="mx-auto max-h-[62vh] w-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-out group-hover:scale-[1.03] group-hover:-rotate-1"
            />
          </button>
        </div>

        <div className="lg:col-span-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[11px] tracking-[0.2em] uppercase">
            <span className="text-ink-2">
              <span className="text-ink">{String(spot + 1).padStart(2, "0")}</span> / {String(spots.length).padStart(2, "0")}
            </span>
            <span className="flex gap-2">
              {[-1, 1].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => step(d)}
                  aria-label={d < 0 ? "Previous stamp" : "Next stamp"}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-base text-ink normal-case transition-colors hover:border-accent hover:bg-accent hover:text-page"
                >
                  {d < 0 ? "←" : "→"}
                </button>
              ))}
            </span>
          </div>
          <div key={hero.id} className="spot-in pt-6">
            <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">Spotlight &middot; {hero.y}</p>
            <h3 className="mt-3 font-serif text-5xl leading-[0.98] tracking-tight text-ink sm:text-6xl">{hero.n}</h3>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">{current.text}</p>
            <button
              type="button"
              onClick={openSpotlight}
              className="mt-8 cursor-pointer rounded-full bg-accent px-6 py-3 font-mono text-[11px] tracking-[0.16em] text-page uppercase transition-transform hover:scale-105"
            >
              Open stamp &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 3. Timeline strip */}
      <div className="reveal">
        <p className="mb-6 font-mono text-[11px] tracking-[0.2em] text-ink-3 uppercase">
          Every stamp of the {chapter.label} &middot; drag &rarr;
        </p>
        <div ref={strip} className="filmstrip -mx-5 flex overflow-x-auto px-5 pb-4 sm:-mx-10 sm:px-10">
          {items.map((s, i) => {
            const first = i === 0 || items[i - 1].y !== s.y;
            return (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  if (moved.current) return;
                  onOpen(s.id, e.currentTarget.querySelector("img")!.getBoundingClientRect());
                }}
                className="group relative flex shrink-0 cursor-pointer flex-col items-start pr-6 text-left"
              >
                <span className="relative mb-5 flex h-7 w-full items-center">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
                  {first ? (
                    <span className="relative rounded-full bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.1em] text-page">
                      {s.y}
                    </span>
                  ) : (
                    <span className="relative h-2 w-2 rounded-full bg-white/30 transition-colors group-hover:bg-accent" />
                  )}
                </span>
                <StampImg
                  path={s.p}
                  className="h-40 w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04] sm:h-48"
                />
                <span className="mt-3 line-clamp-2 w-32 text-[13px] leading-snug text-ink-3 transition-colors group-hover:text-ink">
                  {s.n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <a
        href={next}
        className="reveal ml-auto font-mono text-[11px] tracking-[0.2em] text-ink-2 uppercase transition-colors hover:text-accent"
      >
        {next.startsWith("#chapter") ? `Next: ${next.slice(9)}s →` : "Browse the archive ↓"}
      </a>
    </section>
  );
}
