"use client";

import type { Lite } from "@/lib/home-data";

import { StampImg } from "./stamp-img";
import { useOpenStamp } from "./viewer";

// A stamp, presented in the current theme's frame (see .sf in globals.css), as a button that opens the
// detail overlay. `tone` picks the field colour (0 pink, 1 turmeric, 2 madder red, 3 wine).
export function StampButton({
  stamp,
  tone = 0,
  caption,
  full,
  className = "",
}: {
  stamp: Lite;
  tone?: number;
  caption?: boolean;
  full?: boolean;
  className?: string;
}) {
  const open = useOpenStamp();
  return (
    <button
      type="button"
      aria-label={`Open ${stamp.n}, ${stamp.y}`}
      onClick={(e) => open(stamp.id, e.currentTarget.querySelector("img")!.getBoundingClientRect())}
      className={`group block w-full cursor-pointer text-left ${className}`}
    >
      <span className={`sf tone-${tone % 4}`}>
        <StampImg path={stamp.p} variant={full ? "full" : "thumb"} alt="" />
      </span>
      {caption && (
        <span className="mt-3 flex items-baseline justify-between gap-3 text-[13px] leading-snug">
          <span className="line-clamp-2 text-ink transition-colors group-hover:text-accent">{stamp.n}</span>
          <span className="label shrink-0 text-ink-3">{stamp.y}</span>
        </span>
      )}
    </button>
  );
}

// A big decorative stamp (hero art): same frame, no caption, gentle float.
export function StampArt({ stamp, tone = 0, className = "", drift }: { stamp: Lite; tone?: number; className?: string; drift?: boolean }) {
  return (
    <div className={`${drift ? "drift" : ""} ${className}`}>
      <StampButton stamp={stamp} tone={tone} full />
    </div>
  );
}
