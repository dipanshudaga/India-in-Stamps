"use client";

import { useEffect, useRef } from "react";

import type { Chapter as ChapterData, Lite } from "@/lib/home-data";

import { prefersReducedMotion, useDragScroll, useReveal } from "./hooks";
import { StampImg } from "./stamp-img";

type Open = (id: number, rect: DOMRect) => void;

// D: one full-screen chapter per decade. A giant outlined decade fills in as it scrolls up; two
// featured stamps drift at different speeds; every stamp of the decade runs along a filmstrip.
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
  useReveal(root);

  // --p: 0 -> 1 as the chapter enters (drives the title fill); --s: -1 -> 1 across the viewport
  // (drives the featured stamps' parallax).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--p", "1");
      el.style.setProperty("--s", "0");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh - r.top) / (vh * 0.85), 0), 1);
      const s = Math.min(Math.max(r.top / vh, -1), 1);
      el.style.setProperty("--p", p.toFixed(3));
      el.style.setProperty("--s", s.toFixed(3));
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
  const [a, b] = chapter.featured.map((i) => stamps[i]);

  return (
    <section
      ref={root}
      id={`chapter-${chapter.key}`}
      className="relative flex min-h-svh flex-col justify-between gap-16 overflow-hidden px-5 pt-28 pb-12 sm:px-10"
      style={{ ["--p" as string]: 0, ["--s" as string]: 0 }}
    >
      <div className="relative">
        <h2 className="chapter-title select-none" aria-label={chapter.label}>
          <span className="chapter-outline" aria-hidden>
            {chapter.label}
          </span>
          <span className="chapter-fill" aria-hidden>
            {chapter.label}
          </span>
        </h2>

        <div className="reveal mt-2 max-w-md lg:absolute lg:right-0 lg:bottom-4" style={{ ["--d" as string]: "150ms" }}>
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
            {count.toLocaleString("en-IN")} stamps
          </p>
          <p className="mt-3 font-serif text-2xl leading-snug text-ink-2">
            {chapter.themes.length > 0
              ? `Recurring themes: ${chapter.themes.join(", ").toLowerCase()}.`
              : "A handful of early issues."}
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-12 items-end gap-4">
        {a && (
          <Featured
            stamp={a}
            onOpen={onOpen}
            className="col-span-7 sm:col-span-5 sm:col-start-2"
            style={{ transform: "translateY(calc(var(--s) * 90px))" }}
          />
        )}
        {b && b !== a && (
          <Featured
            stamp={b}
            onOpen={onOpen}
            small
            className="col-span-5 sm:col-span-3 sm:col-start-8"
            style={{ transform: "translateY(calc(var(--s) * -60px))" }}
          />
        )}
      </div>

      <div>
        <p className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-ink-3 uppercase">
          <span>All {count.toLocaleString("en-IN")} &middot; drag &rarr;</span>
        </p>
        <div ref={strip} className="filmstrip -mx-5 flex gap-5 overflow-x-auto px-5 pb-4 sm:-mx-10 sm:px-10">
          {stamps.slice(chapter.start, chapter.end).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                if (moved.current) return;
                onOpen(s.id, e.currentTarget.querySelector("img")!.getBoundingClientRect());
              }}
              className="film-item group flex shrink-0 cursor-pointer flex-col items-start gap-2"
              title={s.n}
            >
              <StampImg
                path={s.p}
                className="h-36 w-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04] sm:h-44"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase transition-colors group-hover:text-accent">
                {s.y}
              </span>
            </button>
          ))}
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

function Featured({
  stamp,
  onOpen,
  className,
  style,
  small,
}: {
  stamp: Lite;
  onOpen: Open;
  className?: string;
  style?: React.CSSProperties;
  small?: boolean;
}) {
  return (
    <figure className={`reveal will-change-transform ${className ?? ""}`} style={style}>
      <button
        type="button"
        onClick={(e) => onOpen(stamp.id, e.currentTarget.querySelector("img")!.getBoundingClientRect())}
        className="group block w-full cursor-pointer text-left"
      >
        <StampImg
          path={stamp.p}
          variant="full"
          className={`mx-auto w-full drop-shadow-[0_30px_50px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-out group-hover:scale-[1.03] group-hover:-rotate-1 ${small ? "max-w-[260px]" : "max-w-[420px]"}`}
        />
        <figcaption className="mt-5 font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase transition-colors group-hover:text-accent">
          {stamp.n} <span className="text-ink-3">&middot; {stamp.y}</span>
        </figcaption>
      </button>
    </figure>
  );
}
