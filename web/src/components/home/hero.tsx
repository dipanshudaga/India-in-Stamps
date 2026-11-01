"use client";

import { useEffect, useRef } from "react";

import type { Lite } from "@/lib/home-data";

import { prefersReducedMotion } from "./hooks";
import { StampImg } from "./stamp-img";

// x, y (% of the hero), width (vw), resting rotation (deg), depth 0 = far, 1 = near. Kept clear of the
// middle band where the headline sits.
const SPOTS: [number, number, number, number, number][] = [
  [4, 12, 9, -6, 0.9],
  [17, 5, 6, 4, 0.4],
  [8, 56, 12, 5, 1],
  [22, 74, 6.5, -4, 0.5],
  [31, 17, 5, 3, 0.3],
  [80, 8, 11, 6, 1],
  [67, 4, 5.5, -5, 0.35],
  [89, 44, 7, 3, 0.6],
  [75, 64, 9.5, -5, 0.9],
  [62, 79, 5, 4, 0.4],
  [34, 85, 5.5, -3, 0.5],
  [52, 2, 6, 2, 0.45],
  [1, 36, 5, 5, 0.3],
  [92, 78, 6, -4, 0.4],
];

// A: stamps float at different depths around the headline. The pointer moves them (near ones more),
// scrolling lifts them away, and far ones are blurred.
export function Hero({
  stamps,
  total,
  onOpen,
}: {
  stamps: Lite[];
  total: number;
  onOpen: (id: number, rect: DOMRect) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const copy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      eased.x += (pointer.x - eased.x) * 0.06;
      eased.y += (pointer.y - eased.y) * 0.06;
      const lift = Math.min(window.scrollY / window.innerHeight, 1.2);
      SPOTS.forEach(([, , , , depth], i) => {
        const el = layers.current[i];
        if (!el) return;
        const x = -eased.x * depth * 34;
        const y = -eased.y * depth * 24 - lift * depth * 260;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      if (copy.current) {
        copy.current.style.opacity = String(Math.max(0, 1 - lift * 1.4));
        copy.current.style.transform = `translate3d(0, ${lift * -60}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={root} className="relative h-svh min-h-[640px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(226,184,107,0.07),transparent_60%)]" />

      {SPOTS.map(([x, y, w, rot, depth], i) => {
        const s = stamps[i];
        if (!s) return null;
        return (
          <div
            key={s.id}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className="absolute will-change-transform"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}vw`, zIndex: Math.round(depth * 10) }}
          >
            <button
              type="button"
              aria-label={`Open ${s.n}, ${s.y}`}
              onClick={(e) => onOpen(s.id, e.currentTarget.getBoundingClientRect())}
              className="hero-stamp block w-full cursor-pointer"
              style={{
                ["--rot" as string]: `${rot}deg`,
                animationDelay: `${300 + i * 90}ms`,
                filter: `blur(${((1 - depth) * 3.2).toFixed(1)}px)`,
                opacity: 0.55 + depth * 0.45,
              }}
            >
              <StampImg path={s.p} eager className="w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]" />
            </button>
          </div>
        );
      })}

      <div
        ref={copy}
        className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center"
      >
        <p className="reveal font-mono text-[11px] tracking-[0.3em] text-accent uppercase" data-in="1">
          {total.toLocaleString("en-IN")} stamps &middot; 1947 &ndash; today
        </p>
        <h1 className="hero-line max-w-5xl font-serif text-6xl leading-[0.95] tracking-tighter text-ink sm:text-8xl lg:text-[9rem]">
          Every stamp India
          <br />
          <span className="text-ink-2 italic">has ever issued.</span>
        </h1>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-ink-3 uppercase">
        Scroll
        <span className="scroll-cue block h-10 w-px bg-ink-3" />
      </div>
    </section>
  );
}
