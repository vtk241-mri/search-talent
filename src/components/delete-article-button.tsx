"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button-styles";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useLocalizedRouter } from "@/lib/i18n/client";

type DeleteArticleButtonProps = {
  articleId: string;
  label: string;
  pendingLabel: string;
  confirmMessage: string;
  confirmTitle?: string;
  confirmButtonLabel?: string;
  cancelLabel?: string;
  errorFallback: string;
  redirectHref?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  adminEndpoint?: boolean;
};

export default function DeleteArticleButton({
  articleId,
  label,
  pendingLabel,
  confirmMessage,
  confirmTitle,
  confirmButtonLabel,
  cancelLabel,
  errorFallback,
  redirectHref,
  size = "sm",
  variant = "ghost",
  adminEndpoint = false,
}: DeleteArticleButtonProps) {
  const router = useLocalizedRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const endpoint = adminEndpoint
        ? `/api/admin/articles/${articleId}`
        : `/api/articles/${articleId}`;
      const response = await fetch(endpoint, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setErrorMessage(payload.error || errorFallback);
        setIsDeleting(false);
        return;
      }

      setDialogOpen(false);
      setIsDeleting(false);

      if (redirectHref) {
        router.replace(redirectHref);
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : errorFallback);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          setErrorMessage(null);
          setDialogOpen(true);
        }}
        disabled={isDeleting}
      >
        {isDeleting ? pendingLabel : label}
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        title={confirmTitle || label}
        description={confirmMessage}
        confirmLabel={confirmButtonLabel || label}
        cancelLabel={cancelLabel || "Cancel"}
        confirmVariant="primary"
        pending={isDeleting}
        pendingLabel={pendingLabel}
        errorMessage={errorMessage}
        onCancel={() => {
          if (!isDeleting) {
            setDialogOpen(false);
            setErrorMessage(null);
          }
        }}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
