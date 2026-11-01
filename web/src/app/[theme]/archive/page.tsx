import { notFound } from "next/navigation";

import { ArchiveBrowser } from "@/components/site/archive-browser";
import { getArchive } from "@/lib/home-data";
import { isTheme } from "@/lib/themes";

export const metadata = { title: "Archive" };

export default async function Archive({ params }: PageProps<"/[theme]/archive">) {
  const { theme } = await params;
  if (!isTheme(theme)) notFound();
  const { stamps, tags } = getArchive();
  return (
    <main className="px-5 pt-32 sm:px-10">
      <p className="label text-accent">The archive</p>
      <h1 className="display mt-4 mb-8 text-[clamp(4rem,11vw,9rem)]">Every stamp</h1>
      <ArchiveBrowser stamps={stamps} tags={tags} />
    </main>
  );
}
