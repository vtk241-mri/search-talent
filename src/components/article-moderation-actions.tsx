"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ArticleModerationStatus = "approved" | "under_review" | "restricted" | "removed";

export default function ArticleModerationActions({
  articleId,
  locale,
  initialNote,
}: {
  articleId: string;
  locale: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const isUkrainian = locale === "uk";
  const [note, setNote] = useState(initialNote || "");
  const [pendingAction, setPendingAction] = useState<ArticleModerationStatus | "">("");
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ui = isUkrainian
    ? {
        placeholder: "Нотатка модератора або коротке пояснення для автора",
        approved: "Схвалити",
        underReview: "На перевірку",
        restricted: "Обмежити",
        removed: "Прибрати",
        saving: "Збереження...",
        success: "Статус модерації оновлено.",
        error: "Не вдалося оновити модерацію статті.",
      }
    : {
        placeholder: "Moderator note or short explanation for the author",
        approved: "Approve",
        underReview: "Review",
        restricted: "Restrict",
        removed: "Remove",
        saving: "Saving...",
        success: "Article moderation was updated.",
        error: "Could not update article moderation.",
      };

  async function applyAction(moderationStatus: ArticleModerationStatus) {
    setPendingAction(moderationStatus);
    setFeedback("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moderation_status: moderationStatus,
          moderation_note: note.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setErrorMessage(payload.error || ui.error);
        return;
      }

      setFeedback(ui.success);
      router.refresh();
    } catch {
      setErrorMessage(ui.error);
    } finally {
      setPendingAction("");
    }
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border app-border bg-[color:var(--surface)] p-4">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        maxLength={1200}
        placeholder={ui.placeholder}
        className="w-full rounded-[1.25rem] border app-border bg-[color:var(--surface-muted)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--foreground)]"
      />

      <div className="flex flex-wrap gap-2">
        <Button disabled={Boolean(pendingAction)} size="sm" onClick={() => void applyAction("approved")}>
          {pendingAction === "approved" ? ui.saving : ui.approved}
        </Button>
        <Button
          disabled={Boolean(pendingAction)}
          variant="secondary"
          size="sm"
          onClick={() => void applyAction("under_review")}
        >
          {pendingAction === "under_review" ? ui.saving : ui.underReview}
        </Button>
        <Button
          disabled={Boolean(pendingAction)}
          variant="secondary"
          size="sm"
          onClick={() => void applyAction("restricted")}
        >
          {pendingAction === "restricted" ? ui.saving : ui.restricted}
        </Button>
        <Button
          disabled={Boolean(pendingAction)}
          variant="ghost"
          size="sm"
          onClick={() => void applyAction("removed")}
        >
          {pendingAction === "removed" ? ui.saving : ui.removed}
        </Button>
      </div>

      {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}
