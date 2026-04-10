/**
 * Supabase Storage image utilities.
 *
 * Builds public URLs for images stored in Supabase buckets and provides
 * helpers for Next.js Image optimisation (the `/_next/image` proxy already
 * handles format conversion to avif/webp and resizing — this module just
 * ensures URLs are consistent and cache-friendly).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Build a public Supabase Storage URL for the given bucket and path.
 * Appends a cache-bust query param when `version` is provided.
 */
export function getStorageUrl(
  bucket: string,
  path: string,
  version?: string | number,
): string {
  const base = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

  if (version) {
    return `${base}?v=${version}`;
  }

  return base;
}

/**
 * Build an optimised Supabase Storage image URL using the render/image
 * endpoint (available on Pro plans and self-hosted with imgproxy enabled).
 *
 * Falls back to the standard public URL when transformations are not
 * available — Next.js Image will still optimise on the edge.
 */
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
  },
): string {
  if (!options?.width && !options?.height) {
    return getStorageUrl(bucket, path);
  }

  const params = new URLSearchParams();

  if (options.width) {
    params.set("width", String(options.width));
  }

  if (options.height) {
    params.set("height", String(options.height));
  }

  if (options.quality) {
    params.set("quality", String(options.quality));
  }

  if (options.resize) {
    params.set("resize", options.resize);
  }

  return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
}

/**
 * Common responsive `sizes` presets for Next.js Image.
 * Using proper sizes prevents the browser from downloading oversized images.
 */
export const imageSizes = {
  /** Avatar / small thumbnail (32-80px) */
  avatar: "80px",
  /** Card thumbnail in a grid */
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Hero / cover image that spans the content area */
  cover: "(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px",
  /** Full-width hero banner */
  banner: "100vw",
  /** Gallery thumbnail in a grid */
  gallery: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
} as const;
