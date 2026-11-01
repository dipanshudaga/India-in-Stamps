import Link from "next/link";

import type { DecadeSummary, Lite } from "@/lib/home-data";
import type { ThemeKey } from "@/lib/themes";

import { StampImg } from "./stamp-img";

// A big way-in card (home): themed panel, number, title, three stamps, an arrow.
export function WayCard({
  theme,
  href,
  n,
  title,
  text,
  thumbs,
  tone,
}: {
  theme: ThemeKey;
  href: string;
  n: string;
  title: string;
  text: string;
  thumbs: Lite[];
  tone: number;
}) {
  return (
    <Link
      href={`/${theme}${href}`}
      className={`panel tone-${tone} group relative flex min-h-[420px] flex-col justify-between overflow-hidden p-7 transition-transform duration-500 hover:-translate-y-1.5 sm:p-10`}
    >
      <span className="label opacity-80">{n}</span>
      <div className="flex justify-center gap-4 py-6">
        {thumbs.map((s, i) => (
          <StampImg
            key={s.id}
            path={s.p}
            className="h-36 w-auto drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-2 sm:h-44"
            style={{ transform: `rotate(${(i - 1) * 6}deg)` }}
          />
        ))}
      </div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="display text-5xl sm:text-6xl">{title}</p>
          <p className="mt-2 max-w-sm text-base opacity-80">{text}</p>
        </div>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-2xl text-white transition-transform duration-500 group-hover:translate-x-1.5">
          &rarr;
        </span>
      </div>
    </Link>
  );
}

// A decade card (decades index).
export function DecadeCard({ theme, d, i }: { theme: ThemeKey; d: DecadeSummary; i: number }) {
  return (
    <Link
      href={`/${theme}/decades/${d.key}`}
      style={{ ["--i" as string]: i }}
      className={`panel rise tone-${i % 4} group relative flex min-h-[360px] flex-col justify-between overflow-hidden p-7 transition-transform duration-500 hover:-translate-y-1.5`}
    >
      <div className="flex items-start justify-between">
        <span className="display text-7xl leading-none sm:text-8xl">{d.label}</span>
        <span className="label mt-2 opacity-80">{d.count.toLocaleString("en-IN")}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex">
          {d.thumbs.map((s, k) => (
            <StampImg
              key={s.id}
              path={s.p}
              className="-mr-5 h-28 w-auto drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-2"
              style={{ transform: `rotate(${(k - 1) * 7}deg)`, transitionDelay: `${k * 50}ms` }}
            />
          ))}
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-xl text-white transition-transform duration-500 group-hover:translate-x-1.5">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
