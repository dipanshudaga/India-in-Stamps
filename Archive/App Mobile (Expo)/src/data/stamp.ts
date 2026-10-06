import Constants from 'expo-constants';

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

// Where `thumbs/` and `full/` are served from. In production that's the R2 bucket
// (EXPO_PUBLIC_IMAGE_BASE_URL). In dev it's the Mac's static server (`npm run images`, port 8090) on
// whatever address the phone just used to reach Metro - read from `hostUri` - so a DHCP lease change
// can never leave the app pointing at a stale IP.
const IMAGE_SERVER_PORT = 8090;

function devImageBase(): string | null {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return __DEV__ && host ? `http://${host}:${IMAGE_SERVER_PORT}` : null;
}

export const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL ?? devImageBase();

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
