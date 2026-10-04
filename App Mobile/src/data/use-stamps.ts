import { useMemo } from 'react';

import rawStamps from './stamps.json';
import type { Stamp } from './stamp';

const stamps = rawStamps as Stamp[];

// Same sort rule as `StampRepository.chronological`: issue date first, falling back to year then
// id when the date didn't parse. Computed once at module load, not per-render — 3,045 items is
// cheap to sort once, but there's no reason to redo it on every screen that wants it.
const chronological = [...stamps].sort((a, b) => {
  if (a.issueDateIso && b.issueDateIso && a.issueDateIso !== b.issueDateIso) {
    return a.issueDateIso < b.issueDateIso ? -1 : 1;
  }
  if (a.year !== b.year) return a.year - b.year;
  return a.id - b.id;
});

// Bundled JSON, no async load needed — mirrors `StampRepository`'s role without the load-once
// lifecycle, since there's no file I/O here (Metro inlines the JSON at bundle time).
export function useStamps() {
  return useMemo(() => ({ stamps, chronological }), []);
}
