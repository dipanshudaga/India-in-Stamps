"use client";

import { useState } from "react";

import type { Lite } from "@/lib/home-data";

import { StampButton } from "./frame";

const PAGE = 48;

// Every stamp of one decade, with a "show more" so a 836-stamp decade doesn't load at once.
export function DecadeGrid({ stamps }: { stamps: Lite[] }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <>
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
        {stamps.slice(0, shown).map((s, i) => (
          <div key={s.id} className="rise" style={{ ["--i" as string]: Math.min(i, 14) }}>
            <StampButton stamp={s} tone={s.id} caption />
          </div>
        ))}
      </div>
      {shown < stamps.length && (
        <div className="mt-14 flex justify-center">
          <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="btn btn-line">
            Show more &middot; {(stamps.length - shown).toLocaleString("en-IN")} left
          </button>
        </div>
      )}
    </>
  );
}
