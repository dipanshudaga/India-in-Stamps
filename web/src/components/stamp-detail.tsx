"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { denominationDisplay, stampImageUrl, type Stamp } from "@/lib/stamp";

// The Wall's detail panel: a side drawer on wide screens, a bottom sheet on phones. Fetches one
// stamp from /api/stamps/[id] (the catalog itself stays on the server).
export function StampDetail({
  id,
  onClose,
}: {
  id: number | null;
  onClose: () => void;
}) {
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [loadedFull, setLoadedFull] = useState<number | null>(null);
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

  return (
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
          <div className="relative mt-6 flex aspect-square items-center justify-center rounded-3xl bg-tint p-8">
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
  );
}
