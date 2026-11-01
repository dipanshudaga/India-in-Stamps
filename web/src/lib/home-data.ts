import "server-only";

import raw from "@/data/stamps.json";
import type { Stamp } from "./stamp";

// A stamp trimmed to what the browse views need (the full record is fetched on demand by the detail
// overlay). `k` indexes into HomeData.tags so the archive can filter without shipping tag strings.
export type Lite = { id: number; n: string; y: number; p: string; k: number[] };

export type Chapter = {
  key: number; // decade start; 1940 covers 1947-49
  label: string; // "1950s"
  short: string; // timeline label
  start: number; // index range into HomeData.stamps (chronological)
  end: number;
  themes: string[]; // the decade's most common tags, from the data
  spotlight: { i: number; text: string }[]; // three best-documented stamps (index into stamps + catalog blurb)
};

export type HomeData = {
  total: number;
  stamps: Lite[];
  chapters: Chapter[];
  tags: string[];
  hero: number[];
};

const decadeOf = (year: number) => (year < 1950 ? 1940 : Math.floor(year / 10) * 10);

export function getHomeData(): HomeData {
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

  const chapters: Chapter[] = [];
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

    // Spotlight: the three best-documented stamps (longest description), from different years if possible.
    const ranked = Array.from({ length: j - i }, (_, n) => i + n).sort(
      (a, b) => all[b].description.length - all[a].description.length,
    );
    const picked: number[] = [];
    for (const x of ranked) {
      if (picked.length < 3 && !picked.some((q) => all[q].year === all[x].year)) picked.push(x);
    }
    for (const x of ranked) if (picked.length < 3 && !picked.includes(x)) picked.push(x);
    picked.sort((a, b) => a - b);

    chapters.push({
      key,
      label: `${key}s`,
      short: key === 1940 ? "47" : `${String(key).slice(2)}s`,
      start: i,
      end: j,
      themes,
      spotlight: picked.map((i) => ({ i, text: all[i].description })),
    });
    i = j;
  }

  const hero = Array.from({ length: 14 }, (_, n) => Math.floor((n * stamps.length) / 14 + 7));

  return { total: stamps.length, stamps, chapters, tags, hero };
}
