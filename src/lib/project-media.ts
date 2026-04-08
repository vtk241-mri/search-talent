export const projectMediaKinds = ["image", "video", "file"] as const;

export type ProjectMediaKind = (typeof projectMediaKinds)[number];

export type ProjectMediaItem = {
  id: string;
  project_id: string;
  owner_id?: string | null;
  url: string;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  media_kind: ProjectMediaKind | null;
  created_at?: string | null;
};

const imageExtensionPattern = /\.(avif|gif|heic|jpeg|jpg|png|svg|webp)$/i;
const videoExtensionPattern = /\.(m4v|mov|mp4|mpeg|mpg|ogv|webm)$/i;

export function inferProjectMediaKind(
  mimeType?: string | null,
  fileNameOrUrl?: string | null,
): ProjectMediaKind {
  if (mimeType?.startsWith("image/")) {
    return "image";
  }

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  if (fileNameOrUrl && imageExtensionPattern.test(fileNameOrUrl)) {
    return "image";
  }

  if (fileNameOrUrl && videoExtensionPattern.test(fileNameOrUrl)) {
    return "video";
  }

  return "file";
}

export function normalizeProjectMediaItem<T extends Partial<ProjectMediaItem>>(
  media: T,
): T & { media_kind: ProjectMediaKind } {
  return {
    ...media,
    media_kind: inferProjectMediaKind(media.mime_type, media.file_name || media.url),
  };
}

export function formatFileSize(size: number | null | undefined) {
  if (!size || size < 1) {
    return null;
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

export function sanitizeStorageFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const name = lastDotIndex > -1 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > -1 ? fileName.slice(lastDotIndex).toLowerCase() : "";

  const sanitizedBase = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${sanitizedBase || "file"}${extension}`;
}
