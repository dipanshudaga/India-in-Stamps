import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { denominationDisplay, stampImageUrl } from "@/lib/stamp";
import { getStamp, parseStampId } from "@/lib/stamps-server";

async function load(props: PageProps<"/stamp/[id]">) {
  const { id } = await props.params;
  const parsed = parseStampId(id);
  const stamp = parsed === undefined ? undefined : getStamp(parsed);
  if (!stamp) notFound();
  return stamp;
}

export async function generateMetadata(props: PageProps<"/stamp/[id]">): Promise<Metadata> {
  const stamp = await load(props);
  const image = stampImageUrl(stamp, "full");
  const title = `${stamp.name} (${stamp.year})`;
  return {
    title,
    description: stamp.description,
    openGraph: { title, description: stamp.description, images: image ? [image] : undefined },
  };
}

// A stamp's own page: the shareable, indexable counterpart to the Wall's detail panel.
export default async function StampPage(props: PageProps<"/stamp/[id]">) {
  const stamp = await load(props);
  const image = stampImageUrl(stamp, "full");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <Link href={`/?s=${stamp.id}`} className="text-sm text-accent underline-offset-4 hover:underline">
        &larr; See it on the Wall
      </Link>

      {image && (
        <div className="flex justify-center rounded-3xl bg-tint px-6 py-10">
          {/* A plain <img>: these are already-optimised transparent cutouts served as static files. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={stamp.name} className="max-h-[60vh] w-auto max-w-full drop-shadow-[0_18px_28px_rgba(60,40,10,0.25)]" />
        </div>
      )}

      <header className="flex flex-col gap-2">
        <p className="text-sm text-ink-3">{stamp.type}</p>
        <h1 className="font-serif text-4xl leading-tight font-semibold">{stamp.name}</h1>
        <p className="text-ink-2">
          {denominationDisplay(stamp)} &middot; {stamp.issueDateDisplay}
        </p>
      </header>

      {stamp.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {stamp.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-structural bg-structural/30 px-3 py-1 text-sm">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">About this stamp</h2>
        <p className="text-lg leading-8">{stamp.description}</p>
      </section>
    </main>
  );
}
