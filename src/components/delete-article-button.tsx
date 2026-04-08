"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button-styles";
import { useLocalizedRouter } from "@/lib/i18n/client";

type DeleteArticleButtonProps = {
  articleId: string;
  label: string;
  pendingLabel: string;
  confirmMessage: string;
  errorFallback: string;
  redirectHref?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export default function DeleteArticleButton({
  articleId,
  label,
  pendingLabel,
  confirmMessage,
  errorFallback,
  redirectHref,
  size = "sm",
  variant = "ghost",
}: DeleteArticleButtonProps) {
  const router = useLocalizedRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setErrorMessage(payload.error || errorFallback);
        return;
      }

      if (redirectHref) {
        router.replace(redirectHref);
        return;
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : errorFallback);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? pendingLabel : label}
      </Button>

      {errorMessage ? <p className="text-sm text-rose-500">{errorMessage}</p> : null}
    </div>
  );
}
