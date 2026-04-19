import imageCompression from "browser-image-compression";

export type CompressionPreset = "avatar" | "cover" | "inline";

const PRESETS: Record<
  CompressionPreset,
  { maxSizeMB: number; maxWidthOrHeight: number }
> = {
  avatar: { maxSizeMB: 0.2, maxWidthOrHeight: 512 },
  cover: { maxSizeMB: 0.6, maxWidthOrHeight: 2048 },
  inline: { maxSizeMB: 0.6, maxWidthOrHeight: 2048 },
};

const SKIP_MIME_TYPES = new Set(["image/gif", "image/svg+xml"]);

export async function compressImageFile(
  file: File,
  preset: CompressionPreset,
): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_MIME_TYPES.has(file.type)) {
    return file;
  }

  const { maxSizeMB, maxWidthOrHeight } = PRESETS[preset];

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.8,
    });

    if (compressed.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([compressed], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
