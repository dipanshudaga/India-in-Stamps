import "server-only";

import raw from "@/data/stamps.json";
import type { Stamp } from "./stamp";

// A stamp trimmed to what the browse views need (the full record is fetched on demand by the detail
// overlay). `k` indexes into the archive's tag list so filters work without shipping tag strings.
export type Lite = { id: number; n: string; y: number; p: string; k: number[] };

export type Spotlight = { stamp: Lite; text: string };

export type DecadeSummary = {
  key: number; // decade start; 1940 covers 1947-49
  label: string; // "1950s"
  short: string; // "50s"
  count: number;
  themes: string[];
  thumbs: Lite[];
};

export type DecadeData = DecadeSummary & {
  stamps: Lite[];
  spotlight: Spotlight[];
  prev: { key: number; label: string } | null;
  next: { key: number; label: string } | null;
};

type Built = {
  stamps: Lite[]; // chronological
  tags: string[];
  decades: (DecadeSummary & { start: number; end: number; spotlight: { i: number; text: string }[] })[];
};

// The placeholder images (Scripts/make_placeholder_images.py) repeat every 36 ids. Preferring distinct
// "looks" when picking a few stamps to show together avoids three identical thumbnails in a row; with the
// real scans every id is already distinct, so this is harmless.
const LOOKS = 36;
function distinct<T extends { id: number }>(list: T[], n: number): T[] {
  const out: T[] = [];
  const seen = new Set<number>();
  for (const x of list) {
    if (out.length >= n || seen.has(x.id % LOOKS)) continue;
    seen.add(x.id % LOOKS);
    out.push(x);
  }
  for (const x of list) if (out.length < n && !out.includes(x)) out.push(x);
  return out;
}

const decadeOf = (year: number) => (year < 1950 ? 1940 : Math.floor(year / 10) * 10);

let cache: Built | undefined;

function build(): Built {
  if (cache) return cache;
  const all = (raw as Stamp[])
    .filter((s) => s.localImageRelativePath)
    .sort(
      (a, b) =>
        (a.issueDateIso ?? String(a.year)).localeCompare(b.issueDateIso ?? String(b.year)) || a.id - b.id,
    );

  const counts = new Map<string, number>();
  for (const s of all) for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);

  const stamps: Lite[] = all.map((s) => ({
    id: s.id,
    n: s.name,
    y: s.year,
    p: s.localImageRelativePath!,
    k: s.tags.map((t) => tags.indexOf(t)).filter((i) => i >= 0),
  }));

  const decades: Built["decades"] = [];
  for (let i = 0; i < all.length; ) {
    const key = decadeOf(all[i].year);
    let j = i;
    while (j < all.length && decadeOf(all[j].year) === key) j++;

    const tally = new Map<string, number>();
    for (let x = i; x < j; x++) for (const t of all[x].tags) if (t !== "Personality") tally.set(t, (tally.get(t) ?? 0) + 1);
    const themes = [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t);

    // Spotlight: the best-documented stamps (longest description), from different years if possible.
    const ranked = Array.from({ length: j - i }, (_, n) => i + n).sort(
      (a, b) => all[b].description.length - all[a].description.length,
    );
    const byDesign = distinct(ranked.map((x) => ({ x, id: all[x].id })), 12).map((o) => o.x);
    const picked: number[] = [];
    for (const x of byDesign) if (picked.length < 3 && !picked.some((q) => all[q].year === all[x].year)) picked.push(x);
    for (const x of byDesign) if (picked.length < 3 && !picked.includes(x)) picked.push(x);
    picked.sort((a, b) => a - b);

    decades.push({
      key,
      label: `${key}s`,
      short: key === 1940 ? "47" : `${String(key).slice(2)}s`,
      count: j - i,
      themes,
      thumbs: picked.map((x) => stamps[x]),
      start: i,
      end: j,
      spotlight: picked.map((x) => ({ i: x, text: all[x].description })),
    });
    i = j;
  }

  cache = { stamps, tags, decades };
  return cache;
}

const summary = (d: Built["decades"][number]): DecadeSummary => ({
  key: d.key,
  label: d.label,
  short: d.short,
  count: d.count,
  themes: d.themes,
  thumbs: d.thumbs,
});

export function getHome() {
  const { stamps, decades } = build();
  return {
    total: stamps.length,
    decades: decades.map(summary),
    // a few stamps from different eras for the hero art
    hero: distinct(
      Array.from({ length: 24 }, (_, k) => stamps[Math.floor((k / 24) * (stamps.length - 1))]),
      6,
    ),
  };
}

export const getDecades = (): DecadeSummary[] => build().decades.map(summary);
export const getDecadeKeys = () => build().decades.map((d) => d.key);

export function getDecade(key: number): DecadeData | undefined {
  const { stamps, decades } = build();
  const idx = decades.findIndex((d) => d.key === key);
  if (idx < 0) return undefined;
  const d = decades[idx];
  const ref = (x: Built["decades"][number]) => ({ key: x.key, label: x.label });
  return {
    ...summary(d),
    stamps: stamps.slice(d.start, d.end),
    spotlight: d.spotlight.map((s) => ({ stamp: stamps[s.i], text: s.text })),
    prev: idx > 0 ? ref(decades[idx - 1]) : null,
    next: idx < decades.length - 1 ? ref(decades[idx + 1]) : null,
  };
}

export function getArchive() {
  const { stamps, tags } = build();
  return { stamps, tags };
}
