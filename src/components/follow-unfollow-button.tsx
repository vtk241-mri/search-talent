"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/lib/i18n/client";

type FollowUnfollowButtonProps = {
  followingUserId: string;
};

export default function FollowUnfollowButton({
  followingUserId,
}: FollowUnfollowButtonProps) {
  const dictionary = useDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const handleUnfollow = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (loading || pending) return;
    setLoading(true);

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingUserId }),
      });

      if (response.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleUnfollow}
      disabled={loading || pending}
      className="inline-flex items-center gap-1.5 rounded-full border app-border px-3 py-1 text-xs font-medium app-muted hover:text-[color:var(--foreground)] disabled:opacity-60"
    >
      {loading || pending
        ? dictionary.follows.unfollowing
        : dictionary.follows.unfollow}
    </button>
  );
}
