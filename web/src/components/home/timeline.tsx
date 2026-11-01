import type { Chapter } from "@/lib/home-data";

// A floating decade dock (Selfridges-style decade pills in a glass capsule). Shows once you are inside
// the chapters; the active decade lights up in the accent colour, a thin line under it shows progress.
export function Dock({
  chapters,
  active,
  onJump,
}: {
  chapters: Chapter[];
  active: number;
  onJump: (key: number) => void;
}) {
  return (
    <nav
      aria-label="Decades"
      className={[
        "fixed bottom-5 left-1/2 z-20 hidden -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-white/6 p-1.5 shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 md:block",
        active >= 0 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      ].join(" ")}
    >
      <ol className="flex gap-1">
        {chapters.map((c, i) => (
          <li key={c.key}>
            <button
              type="button"
              onClick={() => onJump(c.key)}
              aria-current={i === active ? "true" : undefined}
              className={[
                "cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300",
                i === active ? "bg-accent text-page" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {c.short}
            </button>
          </li>
        ))}
      </ol>
      <div className="absolute bottom-0 left-0 h-px w-full origin-left bg-accent" style={{ transform: "scaleX(var(--tp, 0))" }} />
    </nav>
  );
}
