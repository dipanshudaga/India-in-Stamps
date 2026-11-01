import Link from "next/link";

import { THEMES, type ThemeKey } from "@/lib/themes";

export function SiteFooter({ theme, total }: { theme: ThemeKey; total: number }) {
  return (
    <footer className="mt-32 border-t border-white/10 px-5 py-10 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="display text-4xl">India in Stamps</p>
          <p className="label mt-2 text-ink-3">
            {total.toLocaleString("en-IN")} stamps &middot; 1947 &ndash; today &middot; {THEMES[theme].name}
          </p>
        </div>
        <nav className="label flex gap-8 text-ink-2">
          <Link href={`/${theme}/decades`} className="hover:text-accent">Decades</Link>
          <Link href={`/${theme}/archive`} className="hover:text-accent">Archive</Link>
          <a href="#top" className="hover:text-accent">Top &uarr;</a>
        </nav>
      </div>
    </footer>
  );
}
