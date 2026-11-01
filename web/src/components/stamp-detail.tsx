"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { denominationDisplay, stampImageUrl, type Stamp } from "@/lib/stamp";

// Where the clicked stamp sat on screen (px, viewport-relative), so it can fly into the panel.
export type FlightOrigin = { x: number; y: number; size: number };

// Matches the desktop drawer layout below: 440px wide, p-6, hero box mt-6, image inset-8, square.
const DRAWER_W = 440;
const HERO_PAD = 24 + 32;

// The Wall's detail panel: a side drawer on wide screens, a bottom sheet on phones. Fetches one
// stamp from /api/stamps/[id] (the catalog itself stays on the server).
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
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
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

  // Keep the last stamp on screen while the panel slides away, but never show a stale one for a new id.
  const shown = id === null ? stamp : stamp?.id === id ? stamp : null;
  const thumb = shown && stampImageUrl(shown, "thumb");
  const full = shown && stampImageUrl(shown, "full");

  // Fly the stamp from its spot on the wall to its place in the panel (desktop drawer only; on phones
  // the bottom sheet just slides up). Both ends are square boxes with object-contain, so they match.
  // Derived, not stored: it flies once per click (`origin` is a fresh object each time), on desktop only.
  const canFly =
    typeof window !== "undefined" &&
    window.innerWidth >= 640 &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flying = canFly && open && shown && origin && landed !== origin ? shown.id : null;
  useEffect(() => {
    const el = flyer.current;
    if (flying === null || !el || !origin) return;
    const size = Math.min(DRAWER_W - 48 - 64, window.innerHeight - 112);
    const toX = window.innerWidth - DRAWER_W + HERO_PAD;
    const toY = HERO_PAD + 24;
    const s = origin.size / size;
    const anim = el.animate(
      [
        { transform: `translate(${origin.x - toX}px, ${origin.y - toY}px) scale(${s})`, transformOrigin: "0 0" },
        { transform: "translate(0, 0) scale(1)", transformOrigin: "0 0" },
      ],
      { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
    );
    anim.finished.then(() => setLanded(origin)).catch(() => {});
    return () => anim.cancel();
  }, [flying, origin]);

  return (
    <>
      {flying !== null && thumb && origin && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={flyer}
          src={thumb}
          alt=""
          aria-hidden
          className="pointer-events-none fixed z-30 object-contain drop-shadow-[0_14px_22px_rgba(60,40,10,0.28)]"
          style={{
            left: window.innerWidth - DRAWER_W + HERO_PAD,
            top: HERO_PAD + 24,
            width: Math.min(DRAWER_W - 48 - 64, window.innerHeight - 112),
            height: Math.min(DRAWER_W - 48 - 64, window.innerHeight - 112),
          }}
        />
      )}
    <aside
      role="dialog"
      aria-label="Stamp details"
      inert={!open}
      className={[
        "fixed z-20 overflow-y-auto bg-page transition-[transform,box-shadow] duration-300 ease-out",
        open
          ? "shadow-[0_0_60px_rgba(60,40,10,0.25)]"
          : "pointer-events-none shadow-none",
        "inset-x-0 bottom-0 max-h-[78vh] rounded-t-3xl",
        "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-3xl",
        open
          ? "translate-y-0 sm:translate-x-0"
          : "translate-y-full sm:translate-x-full sm:translate-y-0",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 text-2xl leading-none text-ink-2 backdrop-blur hover:bg-card"
      >
        &times;
      </button>

      {shown ? (
        <div className="flex flex-col gap-5 p-6 pb-10">
          <div
            className={`relative mt-6 flex aspect-square items-center justify-center rounded-3xl bg-tint p-8 [&_img]:transition-opacity ${flying === shown.id ? "[&_img]:opacity-0!" : ""}`}
          >
            {thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                aria-hidden
                className="absolute inset-8 h-[calc(100%-4rem)] w-[calc(100%-4rem)] object-contain"
              />
            )}
            {full && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={full}
                alt={shown.name}
                onLoad={() => setLoadedFull(shown.id)}
                className={`relative h-full w-full object-contain drop-shadow-[0_14px_22px_rgba(60,40,10,0.28)] transition-opacity duration-300 ${loadedFull === shown.id ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </div>

          <header className="flex flex-col gap-1.5">
            <p className="text-sm text-ink-3">{shown.type}</p>
            <h2 className="font-serif text-3xl leading-tight font-semibold">
              {shown.name}
            </h2>
            <p className="text-ink-2">
              {denominationDisplay(shown)} &middot; {shown.issueDateDisplay}
            </p>
          </header>

          {shown.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {shown.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-structural bg-structural/30 px-3 py-1 text-sm"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <section className="flex flex-col gap-1.5">
            <h3 className="font-semibold">About this stamp</h3>
            <p className="leading-7">{shown.description}</p>
          </section>

          <Link
            href={`/stamp/${shown.id}`}
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Open this stamp&rsquo;s page &rarr;
          </Link>
        </div>
      ) : (
        <div className="p-6 pt-20 text-ink-3">{open ? "Loading..." : null}</div>
      )}
    </aside>
    </>
  );
}
