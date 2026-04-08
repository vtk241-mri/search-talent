"use client";

import Image from "next/image";
import { useState } from "react";
import { useDictionary } from "@/lib/i18n/client";
import { formatFileSize, type ProjectMediaItem } from "@/lib/project-media";

function getFileLabel(item: ProjectMediaItem) {
  return item.file_name || item.url.split("/").pop() || item.url;
}

function getFileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.at(-1)?.toUpperCase() || "FILE" : "FILE";
}

export default function ProjectGallery({ media }: { media: ProjectMediaItem[] }) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const dictionary = useDictionary();

  if (media.length === 0) {
    return (
      <div className="rounded-[2rem] app-panel-dashed p-8 text-sm app-muted">
        {dictionary.projectPage.noMedia}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {media.map((item, index) => {
          const label = getFileLabel(item);
          const isImage = item.media_kind === "image";
          const isVideo = item.media_kind === "video";

          return (
            <article
              key={item.id}
              className={`overflow-hidden rounded-[1.75rem] border app-border bg-[color:var(--surface)] ${
                index === 0 && isImage ? "lg:col-span-2" : ""
              }`}
            >
              {isImage ? (
                <button
                  type="button"
                  onClick={() => setActiveImage(item.url)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[16/10] bg-[color:var(--surface-muted)]">
                    <Image
                      src={item.url}
                      alt={label}
                      fill
                      className="object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  </div>
                </button>
              ) : isVideo ? (
                <div className="aspect-[16/10] bg-[color:var(--surface-muted)]">
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-[linear-gradient(135deg,rgba(148,163,184,0.2),rgba(255,255,255,0.9))] p-6">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] border app-border bg-[color:var(--surface)] text-xl font-semibold text-[color:var(--foreground)] shadow-sm">
                    {getFileExtension(label)}
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[color:var(--foreground)]">{label}</h3>
                    <p className="mt-1 text-sm capitalize app-muted">
                      {item.media_kind}
                      {item.file_size ? ` / ${formatFileSize(item.file_size)}` : ""}
                    </p>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border app-border px-3 py-1 text-xs font-medium app-muted transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
                  >
                    {isVideo
                      ? dictionary.projectPage.watchVideo
                      : dictionary.projectPage.downloadFile}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeImage && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setActiveImage(null)}
        >
          <Image
            src={activeImage}
            alt="Expanded project media"
            width={1600}
            height={1200}
            className="max-h-[90vh] max-w-[90vw] rounded-3xl"
          />
        </button>
      )}
    </>
  );
}
