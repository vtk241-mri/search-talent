import Image, { type ImageProps } from "next/image";
import { imageSizes } from "@/lib/supabase/image";

type SizePreset = keyof typeof imageSizes;

type OptimizedImageProps = Omit<ImageProps, "sizes"> & {
  /** Use a named preset or pass a custom sizes string. */
  sizePreset?: SizePreset;
  sizes?: string;
};

/**
 * Thin wrapper around Next.js Image that defaults to proper responsive `sizes`
 * based on a preset, so the browser never downloads oversized images.
 *
 * Usage:
 * ```tsx
 * <OptimizedImage src={url} alt="..." fill sizePreset="card" />
 * <OptimizedImage src={url} alt="..." width={80} height={80} sizePreset="avatar" />
 * ```
 */
export default function OptimizedImage({
  sizePreset,
  sizes,
  alt,
  ...props
}: OptimizedImageProps) {
  const resolvedSizes =
    sizes || (sizePreset ? imageSizes[sizePreset] : undefined);

  return <Image sizes={resolvedSizes} alt={alt} {...props} />;
}
