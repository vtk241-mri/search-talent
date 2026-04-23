"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog";

type Props = {
  commentId: string;
  kind: "article" | "project";
  labels: {
    delete: string;
    deleting: string;
    confirmTitle: string;
    confirmMessage: string;
    confirmButton: string;
    cancel: string;
    errorFallback: string;
  };
};

export default function CommentDeleteButton({ commentId, kind, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/comments/${commentId}?kind=${kind}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || labels.errorFallback);
      }
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : labels.errorFallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {labels.delete}
      </Button>
      {open ? (
        <ConfirmDialog
          open={open}
          title={labels.confirmTitle}
          description={labels.confirmMessage}
          confirmLabel={labels.confirmButton}
          cancelLabel={labels.cancel}
          confirmVariant="primary"
          pending={pending}
          pendingLabel={labels.deleting}
          errorMessage={error}
          onConfirm={confirm}
          onCancel={() => {
            if (pending) return;
            setOpen(false);
            setError(null);
          }}
        />
      ) : null}
    </>
  );
}
