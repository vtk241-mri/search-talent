"use client";

import { useMemo, type CSSProperties } from "react";
import { extractPlainTextFromRichText, sanitizeRichTextHtml } from "@/lib/rich-text";

export { extractPlainTextFromRichText as stripRichTextFormatting } from "@/lib/rich-text";

export default function RichTextRenderer({
  content,
  accentColor,
  compact = false,
}: {
  content: string;
  accentColor: string;
  compact?: boolean;
}) {
  const sanitizedHtml = useMemo(() => sanitizeRichTextHtml(content), [content]);
  const hasContent = useMemo(
    () => extractPlainTextFromRichText(sanitizedHtml).length > 0,
    [sanitizedHtml],
  );

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={[
        "rich-text-renderer",
        compact ? "space-y-4 text-sm leading-7" : "space-y-5 text-base leading-8",
        "text-[color:var(--muted-foreground)]",
      ].join(" ")}
      style={{ ["--rich-text-accent" as const]: accentColor } as CSSProperties}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
