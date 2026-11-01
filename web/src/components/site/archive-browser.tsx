"use client";

import { useMemo, useState } from "react";

import type { Lite } from "@/lib/home-data";

import { StampButton } from "./frame";

const PAGE = 40;
const hash = (n: number) => Math.imul(n + 1, 2654435761) >>> 0;

// The archive: a headline of filter words over a grid of every stamp. Mixed across eras (deterministic
// shuffle) so it reads as a browse, not another timeline; search narrows it further.
export function ArchiveBrowser({ stamps, tags }: { stamps: Lite[]; tags: string[] }) {
  const [filter, setFilter] = useState(-1);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const mixed = useMemo(() => [...stamps].sort((a, b) => hash(a.id) - hash(b.id)), [stamps]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mixed.filter((s) => (filter < 0 || s.k.includes(filter)) && (!q || s.n.toLowerCase().includes(q)));
  }, [mixed, filter, query]);

  return (
    <>
      <h2 className="display max-w-6xl text-5xl sm:text-7xl">
        {[-1, ...tags.keys()].map((i) => (
          <span key={i}>
            <button
              type="button"
              aria-pressed={filter === i}
              onClick={() => {
                setFilter(i);
                setShown(PAGE);
              }}
              className={`cursor-pointer transition-colors duration-300 ${filter === i ? "text-accent" : "text-ink-3 hover:text-ink"}`}
            >
              {i < 0 ? "All" : tags[i]}
            </button>
            {i < tags.length - 1 && <span className="text-ink-3">, </span>}
          </span>
        ))}
      </h2>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <p className="label text-ink-3" aria-live="polite">{matches.length.toLocaleString("en-IN")} stamps</p>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search by name"
          aria-label="Search stamps by name"
          className="label w-full max-w-xs border-b border-white/25 bg-transparent py-2 text-ink outline-none placeholder:text-ink-3 focus:border-accent sm:w-72"
        />
      </div>

      <div key={`${filter}-${query}`} className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
        {matches.slice(0, shown).map((s, i) => (
          <div key={s.id} className="rise" style={{ ["--i" as string]: Math.min(i, 14) }}>
            <StampButton stamp={s} tone={s.id} caption />
          </div>
        ))}
      </div>

      {shown < matches.length && (
        <div className="mt-14 flex justify-center">
          <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="btn btn-line">
            Show more &middot; {(matches.length - shown).toLocaleString("en-IN")} left
          </button>
        </div>
      )}
    </>
  );
}
