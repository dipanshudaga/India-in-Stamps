"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";

import { StampDetail, type FlightOrigin } from "@/components/stamp-detail";

import { glideTo, useWallControls, unitsPerPx, zoomBy } from "./use-wall-controls";
import {
  COUNT,
  HEIGHT,
  IDS,
  LAYOUTS,
  LENSES,
  PITCH,
  SIZE,
  stampAtCell,
  YEARS,
  type Lens,
} from "./wall-data";
import { FOV, WallScene, type Controls, type Stats } from "./wall-scene";

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

// Where the camera starts: the left of the Time lens (1947 onward), or on a stamp if the URL names one.
function initialControls(stampId?: number): { current: Controls } {
  const c: Controls = {
    x: 8,
    y: 4,
    z: 18,
    vx: 0,
    vy: 0,
    dragging: false,
    viewW: 1280,
    viewH: 800,
    hover: -1,
    goto: null,
  };
  if (stampId !== undefined) {
    const i = IDS.indexOf(stampId);
    if (i >= 0) {
      c.x = LAYOUTS.time[i * 2];
      c.y = LAYOUTS.time[i * 2 + 1];
      c.z = 12;
    }
  }
  return { current: c };
}

// "The Wall of India": every stamp as one instance in a single 3D scene. A lens switch morphs all
// ~3,000 of them to a new arrangement on the GPU. Click a stamp for its story.
export function WallApp({
  initialStampId,
  debug,
}: {
  initialStampId?: number;
  debug?: boolean;
}) {
  const [lens, setLens] = useState<Lens>("time");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialStampId ?? null,
  );
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const [intro, setIntro] = useState(true);
  const [controls] = useState(() => initialControls(initialStampId));
  const cursor = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);

  // Screen position -> wall index, or undefined if the point is in a gap between stamps.
  // Not memoised: useWallControls always calls the latest version, so identity doesn't matter.
  const cellAt = (x: number, y: number) => {
    const c = controls.current;
    const u = unitsPerPx(c);
    const wx = c.x + (x - c.viewW / 2) * u;
    const wy = c.y - (y - c.viewH / 2) * u;
    const gx = Math.round(wx / PITCH);
    const gy = Math.round(wy / PITCH);
    // Only a hit if the point is on the stamp itself, not in the gap between cells.
    if (Math.abs(wx - gx * PITCH) > SIZE / 2 || Math.abs(wy - gy * PITCH) > SIZE / 2) return undefined;
    return stampAtCell(lens, gx, gy);
  };
  const pick = (x: number, y: number) => {
    if (busy) return;
    const index = cellAt(x, y);
    if (index === undefined) return;
    // Where the stamp sits on screen right now, so the detail view can fly it into place.
    const c = controls.current;
    const u = unitsPerPx(c);
    const size = SIZE / u;
    setOrigin({
      x: c.viewW / 2 + (LAYOUTS[lens][index * 2] - c.x) / u - size / 2,
      y: c.viewH / 2 - (LAYOUTS[lens][index * 2 + 1] - c.y) / u - size / 2,
      size,
    });
    setSelectedId(IDS[index]);
  };
  useWallControls(surface, controls, pick);

  // Custom cursor + hover detection. The cursor eases toward the pointer in its own rAF loop; hover
  // writes straight into `controls` (read by the render loop), so there is no React render per move.
  const cellAtRef = useRef(cellAt);
  const detailOpen = useRef(false);
  useEffect(() => {
    cellAtRef.current = cellAt;
    detailOpen.current = selectedId !== null;
  });
  useEffect(() => {
    const node = surface.current;
    const el = cursor.current;
    if (!node || !el) return;
    const c = controls.current;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;
    const label = { idle: "Drag", open: "Open", dragging: "" } as const;
    let state: keyof typeof label | "hidden" = "hidden";
    const setState = (next: keyof typeof label | "hidden") => {
      if (next === state) return;
      state = next;
      el.dataset.state = next;
      el.textContent = next === "hidden" ? "" : label[next];
    };
    setState("hidden");

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = node.getBoundingClientRect();
      target.x = e.clientX;
      target.y = e.clientY;
      if (state === "hidden") {
        pos.x = target.x;
        pos.y = target.y;
      }
      if (c.dragging || detailOpen.current) {
        c.hover = -1;
        setState(c.dragging ? "dragging" : "idle");
        return;
      }
      const hit = cellAtRef.current(e.clientX - r.left, e.clientY - r.top);
      c.hover = hit ?? -1;
      setState(hit === undefined ? "idle" : "open");
    };
    const leave = () => {
      c.hover = -1;
      setState("hidden");
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerdown", move);
    node.addEventListener("pointerup", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerdown", move);
      node.removeEventListener("pointerup", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [controls]);

  // The opening line stays up while the stamps fly in, then gives way to the wall.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setIntro(false), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2600);
    return () => clearTimeout(t);
  }, [ready]);

  // Keep the URL shareable without navigating: /?s=<id> while a stamp is open.
  useEffect(() => {
    const url = selectedId === null ? "/" : `/?s=${selectedId}`;
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const onReady = useCallback(() => setReady(true), []);
  const onBusy = useCallback((b: boolean) => setBusy(b), []);
  const closeDetail = useCallback(() => setSelectedId(null), []);
  // Glide the camera to the first column of a decade.
  const jumpTo = (decade: number) => {
    const entry = YEARS.find(([y]) => y >= decade) ?? YEARS[YEARS.length - 1];
    glideTo(controls.current, entry[1] * PITCH, HEIGHT / 2);
  };

  const active = LENSES.find((l) => l.key === lens)!;

  return (
    <main className="fixed inset-0 overflow-hidden bg-page text-ink">
      <div
        ref={surface}
        tabIndex={0}
        role="application"
        aria-label="The wall of stamps. Drag to pan, scroll or pinch to zoom, click a stamp to open it. Arrow keys pan, plus and minus zoom."
        className="wall-surface absolute inset-0 cursor-grab outline-none active:cursor-grabbing"
      >
        <Canvas
          // Created at x=y=0 on purpose: R3F aims a new camera at the origin, so any other start
          // would yaw it off-axis and skew the whole wall. The render loop moves it to the real
          // position, keeping it square-on.
          camera={{
            position: [0, 0, controls.current.z],
            fov: FOV,
            near: 0.1,
            far: 3000,
          }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#0b0a09"]} />
          <WallScene
            lens={lens}
            controls={controls}
            onReady={onReady}
            onBusy={onBusy}
            onYear={setYear}
            onStats={debug ? setStats : undefined}
          />
        </Canvas>
      </div>

      {/* Vignette: the edges fall off to black so the stamps glow in the middle. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,10,9,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-page via-page/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-44 bg-linear-to-l from-page/90 to-transparent sm:block" />

      {/* Floating pill nav (Cosmos): brand, lens switch, count. */}
      <header className="absolute inset-x-0 top-4 z-10 flex justify-center px-4 sm:top-6">
        <nav
          aria-label="Lens"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1.5 pl-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <h1 className="pr-3 font-serif text-lg tracking-tight text-ink italic sm:pr-5 sm:text-xl">India in Stamps</h1>
          {LENSES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === lens}
              disabled={busy && key !== lens}
              onClick={() => !busy && setLens(key)}
              className={[
                "rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300 disabled:cursor-wait",
                key === lens ? "bg-ink text-page" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          <span className="hidden pr-4 pl-3 font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase sm:inline">
            {COUNT.toLocaleString("en-IN")}
          </span>
        </nav>
      </header>

      {/* Decade rail (Studio Freight-style mono index): jump the wall to a decade. */}
      {lens === "time" && (
        <ol
          aria-label="Jump to a decade"
          className="absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 flex-col items-end gap-1 sm:flex"
        >
          {DECADES.map((d) => {
            const on = year !== null && year >= d && year < d + 10;
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => jumpTo(d)}
                  className={[
                    "group flex items-center gap-3 py-1 font-mono text-[11px] tracking-[0.14em] transition-colors",
                    on ? "text-accent" : "text-ink-3 hover:text-ink",
                  ].join(" ")}
                >
                  <span>{d}s</span>
                  <span
                    className={`block h-px transition-all duration-300 ${on ? "w-8 bg-accent" : "w-3 bg-current group-hover:w-6"}`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {/* Giant year, bottom left. */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 sm:bottom-8 sm:left-8">
        {lens === "time" && year !== null ? (
          <p
            className="font-serif text-8xl leading-none tracking-tighter text-ink sm:text-[11rem]"
            aria-live="polite"
            aria-label={String(year)}
          >
            <RollingYear year={year} />
          </p>
        ) : (
          <p className="font-serif text-6xl leading-none tracking-tighter text-ink italic sm:text-8xl">Colour</p>
        )}
        <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">{active.caption}</p>
      </div>

      {/* Zoom + hint, bottom right. */}
      <div className="absolute right-5 bottom-5 z-10 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8">
        <p className="hidden font-mono text-[11px] tracking-[0.16em] text-ink-3 uppercase sm:block">
          Drag &middot; Scroll &middot; Click
        </p>
        <div className="flex gap-2">
          {[
            ["\u2212", 1.3, "Zoom out"],
            ["+", 0.77, "Zoom in"],
          ].map(([glyph, f, label]) => (
            <button
              key={label as string}
              type="button"
              aria-label={label as string}
              onClick={() => {
                zoomBy(controls.current, f as number);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xl text-ink backdrop-blur-xl transition-colors hover:bg-white/15"
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>

      {/* Opening screen over the flying stamps. */}
      <div
        className={[
          "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 text-center transition-opacity duration-1000",
          ready && intro ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
          {COUNT.toLocaleString("en-IN")} stamps &middot; 1947 &ndash; today
        </p>
        <p className="max-w-4xl px-6 font-serif text-5xl leading-[0.98] tracking-tighter text-ink sm:text-8xl">
          Every stamp India
          <br />
          <span className="italic">has ever issued.</span>
        </p>
      </div>

      <div ref={cursor} className="wall-cursor" aria-hidden />

      {debug && (
        <p className="pointer-events-none absolute top-24 left-5 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-white tabular-nums sm:left-8">
          {stats
            ? `${stats.fps} fps · ${stats.calls} calls · ${(stats.tris / 1000).toFixed(1)}k tris`
            : "starting"}
        </p>
      )}

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-page">
          <p className="font-serif text-3xl italic">Loading the wall&hellip;</p>
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">
            Fetching {COUNT.toLocaleString("en-IN")} stamps
          </p>
        </div>
      )}

      <StampDetail id={selectedId} origin={origin} onClose={closeDetail} />
    </main>
  );
}

// Each digit is a column of 0-9; changing the year slides the columns (see .roll-strip in globals.css).
function RollingYear({ year }: { year: number }) {
  return (
    <span className="inline-flex" aria-hidden>
      {String(year)
        .split("")
        .map((d, i) => (
          <span key={i} className="roll-col">
            <span className="roll-strip" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="tabular-nums">
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
    </span>
  );
}
