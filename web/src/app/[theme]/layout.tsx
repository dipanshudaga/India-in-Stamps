import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { StampViewer } from "@/components/site/viewer";
import { getHome } from "@/lib/home-data";
import { THEME_KEYS, isTheme } from "@/lib/themes";

export const generateStaticParams = () => THEME_KEYS.map((theme) => ({ theme }));

export default async function ThemeLayout({ children, params }: LayoutProps<"/[theme]">) {
  const { theme } = await params;
  if (!isTheme(theme)) notFound();
  return (
    <div data-theme={theme} id="top" className="min-h-screen bg-page text-ink">
      <StampViewer>
        <SiteNav theme={theme} />
        {children}
        <SiteFooter theme={theme} total={getHome().total} />
      </StampViewer>
    </div>
  );
}
