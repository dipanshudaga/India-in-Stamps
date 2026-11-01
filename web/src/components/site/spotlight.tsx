"use client";

import { useState } from "react";

import type { Spotlight } from "@/lib/home-data";

import { StampButton } from "./frame";

// "01 / 03": the decade's best-documented stamps, big, with the catalog's own story.
export function SpotlightPicker({ items }: { items: Spotlight[] }) {
  const [i, setI] = useState(0);
  const cur = items[i];
  const step = (d: number) => setI((n) => (n + d + items.length) % items.length);
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
      <div key={cur.stamp.id} className="rise mx-auto w-full max-w-sm">
        <StampButton stamp={cur.stamp} tone={i} full />
      </div>
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <p className="label text-ink-2">
            Spotlight &middot; <span className="text-ink">{String(i + 1).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
          </p>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => step(d)}
                aria-label={d < 0 ? "Previous stamp" : "Next stamp"}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-lg transition-colors hover:border-accent hover:bg-accent hover:text-black"
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        </div>
        <div key={cur.stamp.id} className="rise pt-7">
          <p className="label text-accent">{cur.stamp.y}</p>
          <h3 className="display mt-3 text-5xl sm:text-6xl">{cur.stamp.n}</h3>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">{cur.text}</p>
        </div>
      </div>
    </section>
  );
}
