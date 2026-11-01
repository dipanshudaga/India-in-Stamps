"use client";

import { useMemo, useRef, useState } from "react";

import type { Lite } from "@/lib/home-data";

import { useReveal } from "./hooks";
import { StampImg } from "./stamp-img";

const PAGE = 60;

// Deterministic shuffle so the archive mixes eras instead of reading as one long timeline.
const hash = (n: number) => Math.imul(n + 1, 2654435761) >>> 0;

// A, second screen: a filter headline ("All, Personality, History, ...") over a masonry of stamps.
export function Archive({
  stamps,
  tags,
  onOpen,
}: {
  stamps: Lite[];
  tags: string[];
  onOpen: (id: number, rect: DOMRect) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState(-1); // -1 = all, else index into tags
  const [shown, setShown] = useState(PAGE);
  const [query, setQuery] = useState("");
  useReveal(root);

  const mixed = useMemo(() => [...stamps].sort((a, b) => hash(a.id) - hash(b.id)), [stamps]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mixed.filter((s) => (filter < 0 || s.k.includes(filter)) && (!q || s.n.toLowerCase().includes(q)));
  }, [mixed, filter, query]);

  return (
    <section ref={root} id="archive" className="relative px-5 pt-32 pb-32 sm:px-10">
      <p className="reveal font-mono text-[11px] tracking-[0.2em] text-accent uppercase">The archive</p>

      <h2 className="reveal mt-6 max-w-6xl font-serif text-6xl leading-[0.95] tracking-tight sm:text-8xl" style={{ ["--d" as string]: "100ms" }}>
        {[-1, ...tags.keys()].map((i) => (
          <span key={i}>
            <button
              type="button"
              aria-pressed={filter === i}
              onClick={() => {
                setFilter(i);
                setShown(PAGE);
              }}
              className={`cursor-pointer transition-colors duration-300 ${filter === i ? "text-accent italic" : "text-ink-3 hover:text-ink"}`}
            >
              {i < 0 ? "All" : tags[i]}
            </button>
            {i < tags.length - 1 && <span className="text-ink-3">, </span>}
          </span>
        ))}
      </h2>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-ink-3 uppercase" aria-live="polite">
          {matches.length.toLocaleString("en-IN")} stamps
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search by name"
          aria-label="Search stamps by name"
          className="w-full max-w-xs border-b border-white/20 bg-transparent py-2 font-mono text-[12px] tracking-[0.12em] text-ink uppercase outline-none placeholder:text-ink-3 focus:border-accent sm:w-72"
        />
      </div>

      <div key={`${filter}-${query}`} className="archive-grid mt-12 columns-2 gap-5 sm:columns-3 lg:columns-5">
        {matches.slice(0, shown).map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={(e) => onOpen(s.id, e.currentTarget.querySelector("img")!.getBoundingClientRect())}
            className="archive-card group relative mb-5 block w-full cursor-pointer break-inside-avoid"
            style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
          >
            <StampImg
              path={s.p}
              className="w-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-x-0 -bottom-1 translate-y-2 text-center font-mono text-[10px] tracking-[0.14em] text-accent uppercase opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {s.n} &middot; {s.y}
            </span>
          </button>
        ))}
      </div>

      {shown < matches.length && (
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE * 2)}
            className="cursor-pointer rounded-full border border-white/15 px-8 py-3 font-mono text-[11px] tracking-[0.18em] text-ink uppercase transition-colors hover:bg-white/10"
          >
            Show more &middot; {(matches.length - shown).toLocaleString("en-IN")} left
          </button>
        </div>
      )}
    </section>
  );
}
