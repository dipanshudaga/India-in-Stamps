import type { Chapter } from "@/lib/home-data";

// D: a thin timeline across the top. It fills as you scroll, ticks are decades, click to jump.
export function Timeline({
  chapters,
  active,
  onJump,
}: {
  chapters: Chapter[];
  active: number;
  onJump: (key: number) => void;
}) {
  return (
    <nav aria-label="Decades" className="relative hidden h-10 flex-1 md:block">
      <div className="absolute inset-x-0 top-[9px] h-px bg-white/15" />
      <div
        className="absolute top-[9px] left-0 h-px origin-left bg-accent"
        style={{ width: "100%", transform: "scaleX(var(--tp, 0))" }}
      />
      <ol className="absolute inset-x-0 top-0 flex justify-between">
        {chapters.map((c, i) => {
          const on = i === active;
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onJump(c.key)}
                aria-current={on ? "true" : undefined}
                className="group flex cursor-pointer flex-col items-center gap-2"
              >
                <span className={`block w-px transition-all duration-300 ${on ? "h-[18px] bg-accent" : "h-[10px] bg-white/30 group-hover:h-[14px]"}`} />
                <span
                  className={`font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${on ? "text-accent" : "text-ink-3 group-hover:text-ink"}`}
                >
                  {c.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
