import "server-only";

import raw from "@/data/stamps.json";
import type { Stamp } from "./stamp";

// The catalog is 1.9MB of JSON - kept on the server so the Wall's client bundle stays small; the
// browser fetches one stamp at a time from /api/stamps/[id] when it opens a detail panel.
const stamps = raw as Stamp[];
const byId = new Map(stamps.map((s) => [s.id, s]));

export function getStamp(id: number): Stamp | undefined {
  return byId.get(id);
}

export function parseStampId(value: string | undefined): number | undefined {
  if (!value || !/^\d{1,5}$/.test(value)) return undefined;
  return Number(value);
}
