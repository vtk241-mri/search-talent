"use client";

import Image from "next/image";
import { useState } from "react";
import { useDictionary } from "@/lib/i18n/client";
import { compressImageFile } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";

function extractAvatarStoragePath(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const marker = "/storage/v1/object/public/avatars/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  fallbackText,
}: {
  userId: string;
  currentAvatarUrl: string | null;
  fallbackText: string;
}) {
  const supabase = createClient();
  const dictionary = useDictionary();

  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setErrorMessage(null);

      const rawFile = event.target.files?.[0];
      if (!rawFile) {
        return;
      }

      const file = await compressImageFile(rawFile, "avatar");
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "webp";
      const filePath = `${userId}/avatar.${fileExt}`;
      const previousPath = extractAvatarStoragePath(avatarUrl);

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const versionedUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: versionedUrl })
        .eq("user_id", userId);

      if (profileError) {
        throw profileError;
      }

      if (previousPath && previousPath !== filePath) {
        await supabase.storage.from("avatars").remove([previousPath]);
      }

      setAvatarUrl(versionedUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : dictionary.dashboardProfile.avatarUploadFailed,
      );
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border app-border bg-[color:var(--surface-muted)] text-2xl font-semibold text-[color:var(--foreground)]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={dictionary.dashboardProfile.currentAvatar}
              fill
              className="object-cover"
            />
          ) : (
            <span>{fallbackText}</span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-[color:var(--foreground)]">
            {dictionary.dashboardProfile.currentAvatar}
          </p>
          <p className="mt-1 text-sm app-muted">
            {dictionary.dashboardProfile.avatarHint}
          </p>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center rounded-full border app-border bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)]">
        <span>{dictionary.dashboardProfile.uploadAvatar}</span>
        <input
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {uploading && (
        <p className="mt-3 text-sm app-muted">
          {dictionary.dashboardProfile.uploading}
        </p>
      )}

      {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
    </div>
  );
}
