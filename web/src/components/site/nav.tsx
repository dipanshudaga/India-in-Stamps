"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { THEMES, THEME_KEYS, type ThemeKey } from "@/lib/themes";

// Top bar on every page: logo, the two ways in, and a theme switcher that keeps you on the same page.
export function SiteNav({ theme }: { theme: ThemeKey }) {
  const path = usePathname();
  const rest = path.replace(/^\/[abc](?=\/|$)/, "");
  const link = (href: string, label: string) => {
    const on = rest === href || rest.startsWith(`${href}/`);
    return (
      <Link
        href={`/${theme}${href}`}
        className={`label transition-colors ${on ? "text-accent" : "text-ink-2 hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 bg-linear-to-b from-page via-page/90 to-transparent px-5 pt-5 pb-10 sm:px-10">
      <Link href={`/${theme}`} className="display flex items-center gap-3 text-2xl text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xl leading-none text-black">भा</span>
        <span className="hidden sm:inline">India in Stamps</span>
      </Link>
      <nav aria-label="Main" className="flex items-center gap-6 sm:gap-10">
        {link("/decades", "Decades")}
        {link("/archive", "Archive")}
      </nav>
      <div role="group" aria-label="Design direction" className="flex items-center gap-1 rounded-full border border-white/12 bg-white/5 p-1 backdrop-blur">
        {THEME_KEYS.map((k) => (
          <Link
            key={k}
            href={`/${k}${rest}`}
            title={THEMES[k].name}
            aria-current={k === theme ? "true" : undefined}
            className={`label rounded-full px-3 py-1.5 transition-colors ${k === theme ? "bg-accent text-black" : "text-ink-2 hover:text-ink"}`}
          >
            {k.toUpperCase()}
          </Link>
        ))}
      </div>
    </header>
  );
}
