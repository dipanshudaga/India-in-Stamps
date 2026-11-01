"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StampDetail, type FlightOrigin } from "@/components/stamp-detail";
import type { HomeData } from "@/lib/home-data";

import { Archive } from "./archive";
import { Chapter } from "./chapter";
import { Hero } from "./hero";
import { Timeline } from "./timeline";

// The whole site: hero (A) -> one chapter per decade (D) -> archive (A). Owns the open stamp.
export function Site({ data, initialStampId }: { data: HomeData; initialStampId?: number }) {
  const [selectedId, setSelectedId] = useState<number | null>(initialStampId ?? null);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const [active, setActive] = useState(-1);
  const header = useRef<HTMLElement>(null);
  const { stamps, chapters, tags, hero, total } = data;

  const open = useCallback((id: number, rect: DOMRect) => {
    const size = Math.max(rect.width, rect.height);
    setOrigin({ x: rect.left + rect.width / 2 - size / 2, y: rect.top + rect.height / 2 - size / 2, size });
    setSelectedId(id);
  }, []);
  const close = useCallback(() => setSelectedId(null), []);

  // Shareable URL while a stamp is open; page scroll is locked behind the overlay.
  useEffect(() => {
    window.history.replaceState(null, "", selectedId === null ? window.location.pathname : `/?s=${selectedId}`);
    document.documentElement.style.overflow = selectedId === null ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [selectedId]);

  // Timeline: which chapter is under the middle of the screen, and how far through the chapters we are.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      let current = -1;
      let first = Infinity;
      let last = 0;
      chapters.forEach((c, i) => {
        const r = document.getElementById(`chapter-${c.key}`)?.getBoundingClientRect();
        if (!r) return;
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) current = i;
        first = Math.min(first, r.top + window.scrollY);
        last = Math.max(last, r.bottom + window.scrollY);
      });
      const p = Math.min(Math.max((window.scrollY + vh * 0.5 - first) / (last - first), 0), 1);
      header.current?.style.setProperty("--tp", p.toFixed(3));
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [chapters]);

  const jump = (key: number) =>
    document.getElementById(`chapter-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main>
      <header
        ref={header}
        className="fixed inset-x-0 top-0 z-20 flex items-start gap-8 bg-linear-to-b from-page via-page/80 to-transparent px-5 pt-5 pb-8 sm:px-10"
      >
        <a href="#top" className="font-serif text-xl tracking-tight text-ink italic">
          India in Stamps
        </a>
        <Timeline chapters={chapters} active={active} onJump={jump} />
        <a
          href="#archive"
          className="ml-auto font-mono text-[11px] tracking-[0.18em] text-ink-2 uppercase transition-colors hover:text-accent md:ml-0"
        >
          Archive
        </a>
      </header>

      <div id="top" />
      <Hero stamps={hero.map((i) => stamps[i])} total={total} onOpen={open} />
      {chapters.map((c, i) => (
        <Chapter
          key={c.key}
          chapter={c}
          stamps={stamps}
          next={i < chapters.length - 1 ? `#chapter-${chapters[i + 1].key}` : "#archive"}
          onOpen={open}
        />
      ))}
      <Archive stamps={stamps} tags={tags} onOpen={open} />

      <footer className="px-5 pb-12 sm:px-10">
        <p className="border-t border-white/10 pt-8 font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">
          India in Stamps &middot; {total.toLocaleString("en-IN")} stamps, 1947 &ndash; today
        </p>
      </footer>

      <StampDetail id={selectedId} origin={origin} onClose={close} />
    </main>
  );
}
