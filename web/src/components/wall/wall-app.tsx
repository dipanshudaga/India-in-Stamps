"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";

import { StampDetail } from "@/components/stamp-detail";

import { useWallControls, unitsPerPx } from "./use-wall-controls";
import {
  COUNT,
  IDS,
  LAYOUTS,
  LENSES,
  PITCH,
  SIZE,
  stampAtCell,
  type Lens,
} from "./wall-data";
import { FOV, WallScene, type Controls, type Stats } from "./wall-scene";

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
  const [controls] = useState(() => initialControls(initialStampId));
  const surface = useRef<HTMLDivElement>(null);

  // Not memoised: useWallControls always calls the latest version, so identity doesn't matter.
  const pick = (x: number, y: number) => {
    if (busy) return;
    const c = controls.current;
    const u = unitsPerPx(c);
    const wx = c.x + (x - c.viewW / 2) * u;
    const wy = c.y - (y - c.viewH / 2) * u;
    const gx = Math.round(wx / PITCH);
    const gy = Math.round(wy / PITCH);
    // Only a hit if the click landed on the stamp itself, not in the gap between cells.
    if (
      Math.abs(wx - gx * PITCH) > SIZE / 2 ||
      Math.abs(wy - gy * PITCH) > SIZE / 2
    )
      return;
    const index = stampAtCell(lens, gx, gy);
    if (index !== undefined) setSelectedId(IDS[index]);
  };
  useWallControls(surface, controls, pick);

  // Keep the URL shareable without navigating: /?s=<id> while a stamp is open.
  useEffect(() => {
    const url = selectedId === null ? "/" : `/?s=${selectedId}`;
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const onReady = useCallback(() => setReady(true), []);
  const onBusy = useCallback((b: boolean) => setBusy(b), []);
  const closeDetail = useCallback(() => setSelectedId(null), []);

  const active = LENSES.find((l) => l.key === lens)!;

  return (
    <main className="fixed inset-0 overflow-hidden bg-page">
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
          <color attach="background" args={["#faf8f4"]} />
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

      {/* Soft page-coloured scrims so the title, year and lens switcher stay legible over stamps. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-page via-page/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-page via-page/70 to-transparent" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-8">
        <div className="max-w-[60%]">
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            India in Stamps
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {COUNT.toLocaleString("en-IN")} stamps &middot; {active.caption}
          </p>
        </div>
        {lens === "time" && year !== null && (
          <p
            className="font-serif text-5xl leading-none font-semibold tabular-nums text-ink/90 sm:text-7xl"
            aria-live="polite"
          >
            {year}
          </p>
        )}
      </header>

      <nav
        className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 sm:bottom-8"
        aria-label="Lens"
      >
        <div className="flex rounded-full bg-card/90 p-1 shadow-[0_2px_14px_rgba(60,40,10,0.18)] backdrop-blur">
          {LENSES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === lens}
              disabled={busy && key !== lens}
              onClick={() => !busy && setLens(key)}
              className={[
                "rounded-full px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-40",
                key === lens ? "bg-ink text-page" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3">
          Drag to explore &middot; scroll to zoom &middot; click a stamp
        </p>
      </nav>

      {debug && (
        <p className="pointer-events-none absolute top-24 left-5 rounded-full bg-ink/70 px-3 py-1 text-[11px] text-white tabular-nums sm:left-8">
          {stats
            ? `${stats.fps} fps · ${stats.calls} calls · ${(stats.tris / 1000).toFixed(1)}k tris`
            : "starting"}
        </p>
      )}

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-page">
          <p className="font-serif text-2xl">Loading the wall&hellip;</p>
          <p className="text-sm text-ink-3">
            Fetching {COUNT.toLocaleString("en-IN")} stamps
          </p>
        </div>
      )}

      <StampDetail id={selectedId} onClose={closeDetail} />
    </main>
  );
}
