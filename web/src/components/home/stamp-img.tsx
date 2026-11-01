import { stampImageUrl, type ImageVariant } from "@/lib/stamp";

// A plain <img>: stamps are already-optimised static files (see lib/stamp.ts), so next/image adds nothing.
export function StampImg({
  path,
  variant = "thumb",
  alt = "",
  className,
  style,
  eager,
}: {
  path: string;
  variant?: ImageVariant;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}) {
  const src = stampImageUrl({ localImageRelativePath: path }, variant)!;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={style}
    />
  );
}
