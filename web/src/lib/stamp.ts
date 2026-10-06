// Mirrors `Sources/Models/Stamp.swift` (native apps) and the Scripts/csv_to_json.py export.
export type Stamp = {
  id: number;
  name: string;
  issueDateDisplay: string;
  issueDateIso: string | null;
  year: number;
  denominationINR: number;
  type: string;
  imageURL: string | null;
  localImageRelativePath: string | null;
  brochureURL: string | null;
  pageURL: string | null;
  tags: string[];
  description: string;
};

// Where `thumbs/`, `atlas/` and `full/` are served from. Same-origin `/stamps` in dev (files live in
// web/public/stamps, see Scripts/make_thumbs.py); a CDN/R2 URL in production. Same-origin matters: WebGL
// textures need CORS headers on any other origin.
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "/stamps";

export type ImageVariant = "thumb" | "full";

export function stampImageUrl(
  stamp: Pick<Stamp, "localImageRelativePath">,
  variant: ImageVariant,
): string | null {
  const relative = stamp.localImageRelativePath;
  if (!relative) return null;
  return variant === "thumb"
    ? `${IMAGE_BASE}/thumbs/${relative.replace(/\.png$/, ".webp")}`
    : `${IMAGE_BASE}/full/${relative}`;
}

export function denominationDisplay(stamp: Pick<Stamp, "denominationINR">): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(stamp.denominationINR);
}
