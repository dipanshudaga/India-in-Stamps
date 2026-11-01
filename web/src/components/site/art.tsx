// Hand-drawn SVG motifs, deliberately rough and flat. Kept in one file so they can be swapped for real
// illustration later without touching the pages.

const enc = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

// A repeating strip of fish (the classic Bengal/Mithila motif), used as a divider in theme B.
const FISH = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44">
<g fill="none" stroke="#f5efe1" stroke-width="2.2" stroke-linejoin="round">
<path d="M8 22 C 30 2 62 2 88 22 C 62 42 30 42 8 22Z" fill="#d9a92a"/><path d="M86 22 L112 8 C108 18 108 26 112 36Z" fill="#c6486a"/>
<circle cx="28" cy="19" r="3" fill="#120d0f" stroke="none"/><path d="M44 12 C48 20 48 24 44 32M56 11 C60 20 60 24 56 33M68 13 C72 20 72 24 68 31"/></g></svg>`;
export const fishStrip = enc(FISH);

export function Sun({ className = "", stroke = "currentColor" }: { className?: string; stroke?: string }) {
  const rays = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI * 2) / 24;
    return <path key={i} d={`M${100 + 62 * Math.cos(a)} ${100 + 62 * Math.sin(a)} L${100 + 92 * Math.cos(a)} ${100 + 92 * Math.sin(a)}`} />;
  });
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" aria-hidden>
      <circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="30" strokeDasharray="1 9" />
      <circle cx="100" cy="100" r="12" fill={stroke} stroke="none" />
      {rays}
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 120" className={className} aria-hidden>
      <path d="M0 40 H150 V6 L240 60 L150 114 V80 H0Z" fill="currentColor" />
    </svg>
  );
}

export function Lotus({ className = "" }: { className?: string }) {
  const petal = "M0 0 C 26 -22 26 -70 0 -96 C -26 -70 -26 -22 0 0Z";
  return (
    <svg viewBox="-110 -110 220 130" className={className} aria-hidden>
      {[-64, 64, -34, 34, 0].map((r, i) => (
        <path key={r} d={petal} transform={`rotate(${r})`} fill={["#a8272d", "#a8272d", "#c6486a", "#c6486a", "#d9a92a"][i]} stroke="#120d0f" strokeWidth="3" />
      ))}
    </svg>
  );
}
