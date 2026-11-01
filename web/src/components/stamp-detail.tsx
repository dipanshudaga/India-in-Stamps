"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { denominationDisplay, stampImageUrl, type Stamp } from "@/lib/stamp";

// Where the clicked stamp sat on screen (px, viewport-relative), so it can fly into the detail view.
export type FlightOrigin = { x: number; y: number; size: number };

// Desktop layout: the stamp stage is the left 55% of the screen, and the stamp is the largest square
// that fits it. The same formula is in the CSS below (`STAGE`), so the flight lands exactly on it.
const MIN_FLIGHT_WIDTH = 768;
const stageSize = () => Math.min(window.innerWidth * 0.55 - 96, window.innerHeight - 160);
const STAGE = "w-[min(calc(55vw-96px),calc(100vh-160px))]";

// Full-screen detail: a dark overlay with the stamp lit on the left and its story on the right. Fetches
// one stamp from /api/stamps/[id] (the catalog itself stays on the server).
export function StampDetail({
  id,
  origin,
  onClose,
}: {
  id: number | null;
  origin?: FlightOrigin | null;
  onClose: () => void;
}) {
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [loadedFull, setLoadedFull] = useState<number | null>(null);
  const [landed, setLanded] = useState<FlightOrigin | null>(null);
  const flyer = useRef<HTMLImageElement>(null);
  const open = id !== null;

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    fetch(`/api/stamps/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s: Stamp) => {
        if (!cancelled) setStamp(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Keep the last stamp on screen while the overlay fades, but never show a stale one for a new id.
  const shown = id === null ? stamp : stamp?.id === id ? stamp : null;
  const thumb = shown && stampImageUrl(shown, "thumb");
  const full = shown && stampImageUrl(shown, "full");

  // Derived, not stored: it flies once per click (`origin` is a fresh object each time), desktop only.
  const canFly =
    typeof window !== "undefined" &&
    window.innerWidth >= MIN_FLIGHT_WIDTH &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flying = canFly && open && shown && origin && landed !== origin ? shown.id : null;

  useEffect(() => {
    const el = flyer.current;
    if (flying === null || !el || !origin) return;
    const size = stageSize();
    const toX = (window.innerWidth * 0.55 - size) / 2;
    const toY = (window.innerHeight - size) / 2;
    const anim = el.animate(
      [
        {
          transform: `translate(${origin.x - toX}px, ${origin.y - toY}px) scale(${origin.size / size})`,
          transformOrigin: "0 0",
        },
        { transform: "translate(0, 0) scale(1)", transformOrigin: "0 0" },
      ],
      { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
    );
    anim.finished.then(() => setLanded(origin)).catch(() => {});
    return () => anim.cancel();
  }, [flying, origin]);

  const tilt = "drop-shadow-[0_0_70px_rgba(255,90,45,0.2)]";

  return (
    <>
      {flying !== null && thumb && origin && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={flyer}
          src={thumb}
          alt=""
          aria-hidden
          className={`pointer-events-none fixed z-40 object-contain ${tilt}`}
          style={{
            left: (window.innerWidth * 0.55 - stageSize()) / 2,
            top: (window.innerHeight - stageSize()) / 2,
            width: stageSize(),
            height: stageSize(),
          }}
        />
      )}

      <div
        role="dialog"
        aria-label="Stamp details"
        inert={!open}
        className={[
          "fixed inset-0 z-30 overflow-y-auto bg-page/92 backdrop-blur-2xl transition-opacity duration-500",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onClose}
          className="fixed top-5 right-5 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-white/6 py-2 pr-2 pl-5 font-mono text-[11px] tracking-[0.14em] text-ink uppercase backdrop-blur-xl transition-colors hover:bg-white/15 sm:top-6 sm:right-8"
        >
          Close
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-base leading-none text-page">
            &times;
          </span>
        </button>

        {shown ? (
          <div className="flex min-h-full flex-col md:flex-row">
            {/* Stage: the stamp, lit from behind. */}
            <div className="relative flex min-h-[60vh] items-center justify-center md:min-h-screen md:w-[55%]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,90,45,0.10),transparent_62%)]" />
              <div className={`relative aspect-square w-[min(80vw,60vh)] ${STAGE.replace("w-[", "md:w-[")}`}>
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    aria-hidden
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${tilt} ${flying === shown.id ? "opacity-0" : "opacity-100"}`}
                  />
                )}
                {full && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={full}
                    alt={shown.name}
                    onLoad={() => setLoadedFull(shown.id)}
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${tilt} ${loadedFull === shown.id && flying !== shown.id ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>
            </div>

            {/* Story. */}
            <div className="flex flex-col justify-center gap-8 px-6 pt-4 pb-16 md:w-[45%] md:py-24 md:pr-16 md:pl-4">
              <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
                {shown.type} &middot; {shown.year}
              </p>
              <h2 className="font-serif text-5xl leading-[0.98] tracking-tighter text-ink sm:text-7xl">{shown.name}</h2>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-y border-white/10 py-5 font-mono text-[11px] tracking-[0.14em] uppercase">
                <div>
                  <dt className="text-ink-3">Issued</dt>
                  <dd className="mt-1 text-ink">{shown.issueDateDisplay}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Denomination</dt>
                  <dd className="mt-1 text-ink">{denominationDisplay(shown)}</dd>
                </div>
              </dl>

              <p className="max-w-xl font-serif text-xl leading-8 text-ink-2 sm:text-2xl sm:leading-9">
                {shown.description}
              </p>

              {shown.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {shown.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/15 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-ink-2 uppercase"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/stamp/${shown.id}`}
                className="w-fit font-mono text-[11px] tracking-[0.14em] text-accent uppercase underline-offset-8 hover:underline"
              >
                Open this stamp&rsquo;s page &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-3 uppercase">
            {open ? "Loading" : null}
          </div>
        )}
      </div>
    </>
  );
}
