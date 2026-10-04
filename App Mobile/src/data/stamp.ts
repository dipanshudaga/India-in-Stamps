// Mirrors `Sources/Models/Stamp.swift` in the native app.
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

// Where `thumbs/` and `full/` are served from. In dev that's the Mac's static server
// (`App Mobile/.env.local`, `Scripts/make_thumbs.py`); in production it'll be the R2 bucket with the
// same two prefixes, so only this env var changes.
export const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL ?? null;

export type ImageVariant = 'thumb' | 'full';

// Grid cells use the 360px WebP thumbnail; the detail hero uses the full cutout PNG.
export function stampImageUrl(stamp: Stamp, variant: ImageVariant): string | null {
  const relative = stamp.localImageRelativePath;
  if (!relative || !IMAGE_BASE_URL) return null;
  return variant === 'thumb'
    ? `${IMAGE_BASE_URL}/thumbs/${relative.replace(/\.png$/, '.webp')}`
    : `${IMAGE_BASE_URL}/full/${relative}`;
}

export function denominationDisplay(stamp: Stamp): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(stamp.denominationINR);
}
