"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  extractPlainTextFromRichText,
  extractYouTubeVideoId,
  sanitizeRichTextHtml,
} from "@/lib/rich-text";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type InlineAssetUploadResult = { url: string; label?: string | null };

type RichTextComposerProps = {
  locale: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  hint?: string;
  maxLength?: number;
  minHeight?: number;
  contentClassName?: string;
  toolbarSuffix?: ReactNode;
  showYouTube?: boolean;
  onUploadInlineAsset?: (
    file: File,
    kind: "image",
  ) => Promise<InlineAssetUploadResult | null>;
};

type PopoverKind = "link" | "youtube" | null;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const btnBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition select-none";
const btnIdle =
  "border-transparent text-[color:var(--muted-foreground)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]";
const btnActive =
  "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]";

function saveSelection(): Range | null {
  const sel = window.getSelection();
  return sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
}

function restoreSelection(range: Range | null) {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ------------------------------------------------------------------ */
/*  Inline popover for link / YouTube                                  */
/* ------------------------------------------------------------------ */

function InlinePopover({
  kind,
  locale,
  onSubmit,
  onClose,
}: {
  kind: "link" | "youtube";
  locale: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUk = locale === "uk";

  const label =
    kind === "link"
      ? isUk
        ? "URL посилання"
        : "Link URL"
      : isUk
        ? "Посилання на YouTube"
        : "YouTube link";

  const placeholderText =
    kind === "link" ? "https://example.com" : "https://youtube.com/watch?v=...";

  const submitLabel = isUk ? "Вставити" : "Insert";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleSubmit = () => {
    const val = inputRef.current?.value.trim();
    if (val) onSubmit(val);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-80 rounded-2xl border app-border bg-[color:var(--surface)] p-3 shadow-2xl"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider app-soft">
        {label}
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          placeholder={placeholderText}
          className="flex-1 rounded-xl border app-border bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--ring)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") onClose();
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--background)] transition hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function RichTextComposer({
  locale,
  value,
  onChange,
  placeholder,
  label,
  hint,
  maxLength,
  minHeight = 340,
  contentClassName = "",
  toolbarSuffix,
  showYouTube = false,
  onUploadInlineAsset,
}: RichTextComposerProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const blocksMenuRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSyncRef = useRef("");
  const imageInputId = useId();

  const [blocksOpen, setBlocksOpen] = useState(false);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false });

  const isUk = locale === "uk";
  const ui = useMemo(
    () =>
      isUk
        ? {
            structureTitle: "Базові блоки",
            listTitle: "Списки",
            paragraph: "Параграф",
            heading: "Заголовок",
            quote: "Цитата",
            ul: "Маркований список",
            ol: "Нумерований список",
            bold: "Жирний (Ctrl+B)",
            italic: "Курсив (Ctrl+I)",
            link: "Посилання (Ctrl+K)",
            highlight: "Підсвітка",
            code: "Код",
            image: "Фото",
            youtube: "YouTube відео",
            chars: "символів",
            uploading: "Завантаження…",
          }
        : {
            structureTitle: "Basic blocks",
            listTitle: "Lists",
            paragraph: "Paragraph",
            heading: "Heading",
            quote: "Quote",
            ul: "Bulleted list",
            ol: "Numbered list",
            bold: "Bold (Ctrl+B)",
            italic: "Italic (Ctrl+I)",
            link: "Link (Ctrl+K)",
            highlight: "Highlight",
            code: "Code",
            image: "Image",
            youtube: "YouTube video",
            chars: "characters",
            uploading: "Uploading…",
          },
    [isUk],
  );

  /* ---- sync external value → editor ---- */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const sanitized = sanitizeRichTextHtml(value);
    if (lastSyncRef.current === sanitized && el.innerHTML === sanitized)
      return;
    if (document.activeElement !== el) el.innerHTML = sanitized;
    lastSyncRef.current = sanitized;
  }, [value]);

  /* ---- close blocks dropdown on outside click ---- */
  useEffect(() => {
    if (!blocksOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (blocksMenuRef.current?.contains(e.target)) return;
      setBlocksOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [blocksOpen]);

  /* ---- query active formatting state ---- */
  const refreshActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
    });
  }, []);

  /* ---- core editor helpers ---- */
  const syncEditorValue = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sanitized = sanitizeRichTextHtml(el.innerHTML);
    lastSyncRef.current = sanitized;
    if (el.innerHTML !== sanitized) el.innerHTML = sanitized;
    onChange(sanitized);
  }, [onChange]);

  const focusEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (!el.innerHTML.trim()) {
      el.innerHTML = "<p><br></p>";
      syncEditorValue();
    }
    restoreSelection(savedRangeRef.current);
  }, [syncEditorValue]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      focusEditor();
      if (command === "hiliteColor")
        document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, arg);
      savedRangeRef.current = saveSelection();
      syncEditorValue();
      refreshActiveFormats();
    },
    [focusEditor, syncEditorValue, refreshActiveFormats],
  );

  const insertHtml = useCallback(
    (html: string) => {
      focusEditor();
      restoreSelection(savedRangeRef.current);
      document.execCommand("insertHTML", false, html);
      savedRangeRef.current = saveSelection();
      syncEditorValue();
    },
    [focusEditor, syncEditorValue],
  );

  /* ---- toolbar actions ---- */
  const applyBlock = useCallback(
    (tag: "P" | "H3" | "BLOCKQUOTE") => {
      exec("formatBlock", tag);
      setBlocksOpen(false);
    },
    [exec],
  );

  const openPopover = useCallback(
    (kind: PopoverKind) => {
      savedRangeRef.current = saveSelection();
      setPopover(kind);
    },
    [],
  );

  const handleLinkSubmit = useCallback(
    (href: string) => {
      if (!/^https?:\/\//i.test(href)) return;
      exec("createLink", href);
    },
    [exec],
  );

  const handleYouTubeSubmit = useCallback(
    (url: string) => {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;
      insertHtml(
        `<figure><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></figure>`,
      );
    },
    [insertHtml],
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onUploadInlineAsset) {
        e.target.value = "";
        return;
      }
      setUploadingImage(true);
      try {
        const result = await onUploadInlineAsset(file, "image");
        if (result) {
          insertHtml(
            `<figure><img src="${result.url}" alt="${result.label || file.name}"><figcaption>${result.label || file.name}</figcaption></figure>`,
          );
        }
      } finally {
        e.target.value = "";
        setUploadingImage(false);
      }
    },
    [onUploadInlineAsset, insertHtml],
  );

  /* ---- keyboard shortcuts ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          exec("bold");
          break;
        case "i":
          e.preventDefault();
          exec("italic");
          break;
        case "k":
          e.preventDefault();
          openPopover("link");
          break;
      }
    },
    [exec, openPopover],
  );

  /* ---- selection tracking ---- */
  const trackSelection = useCallback(() => {
    savedRangeRef.current = saveSelection();
    refreshActiveFormats();
  }, [refreshActiveFormats]);

  const editorPlainText = extractPlainTextFromRichText(value);
  const isEmpty = editorPlainText.length === 0;

  /* ---- prevent default on toolbar mousedown to not steal focus ---- */
  const pd = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="space-y-3">
      {/* Label / hint / counter */}
      {(label || hint || maxLength) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {label && (
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                {label}
              </p>
            )}
            {hint && <p className="mt-1 text-sm app-muted">{hint}</p>}
          </div>
          {typeof maxLength === "number" && (
            <span className="text-xs app-soft">
              {editorPlainText.length} / {maxLength} {ui.chars}
            </span>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[1.75rem] border app-border bg-[color:var(--surface)] shadow-[0_22px_90px_rgba(2,6,23,0.18)]">
        {/* -------- Toolbar -------- */}
        <div className="relative border-b app-border bg-[color:var(--surface-muted)]/55 px-3 py-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* + Block menu */}
            <div className="relative" ref={blocksMenuRef}>
              <button
                type="button"
                className={cls(btnBase, blocksOpen ? btnActive : btnIdle)}
                onMouseDown={pd}
                onClick={() => setBlocksOpen((v) => !v)}
              >
                <span className="text-base leading-none">+</span>
              </button>

              {blocksOpen && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-2xl border app-border bg-[color:var(--surface)] p-2.5 shadow-2xl">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider app-soft">
                    {ui.structureTitle}
                  </p>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]" onMouseDown={pd} onClick={() => applyBlock("P")}>
                    <span className="w-6 text-center text-base text-[color:var(--muted-foreground)]">¶</span>
                    {ui.paragraph}
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]" onMouseDown={pd} onClick={() => applyBlock("H3")}>
                    <span className="w-6 text-center text-sm font-bold text-[color:var(--muted-foreground)]">H</span>
                    {ui.heading}
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]" onMouseDown={pd} onClick={() => applyBlock("BLOCKQUOTE")}>
                    <span className="w-6 text-center text-base text-[color:var(--muted-foreground)]">&#10077;</span>
                    {ui.quote}
                  </button>

                  <div className="my-2 border-t app-border" />

                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider app-soft">
                    {ui.listTitle}
                  </p>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]" onMouseDown={pd} onClick={() => { exec("insertUnorderedList"); setBlocksOpen(false); }}>
                    <span className="w-6 text-center text-lg leading-none text-[color:var(--muted-foreground)]">•</span>
                    {ui.ul}
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]" onMouseDown={pd} onClick={() => { exec("insertOrderedList"); setBlocksOpen(false); }}>
                    <span className="w-6 text-center text-sm font-bold text-[color:var(--muted-foreground)]">1.</span>
                    {ui.ol}
                  </button>
                </div>
              )}
            </div>

            <div className="mx-0.5 h-5 w-px bg-[color:var(--border)]" />

            {/* Bold */}
            <button type="button" className={cls(btnBase, activeFormats.bold ? btnActive : btnIdle)} onMouseDown={pd} onClick={() => exec("bold")} title={ui.bold}>
              <span className="text-sm font-bold">B</span>
            </button>

            {/* Italic */}
            <button type="button" className={cls(btnBase, activeFormats.italic ? btnActive : btnIdle)} onMouseDown={pd} onClick={() => exec("italic")} title={ui.italic}>
              <span className="text-sm italic">I</span>
            </button>

            {/* Link */}
            <button type="button" className={cls(btnBase, popover === "link" ? btnActive : btnIdle)} onMouseDown={pd} onClick={() => openPopover(popover === "link" ? null : "link")} title={ui.link}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
              </svg>
            </button>

            {/* Highlight */}
            <button type="button" className={cls(btnBase, btnIdle)} onMouseDown={pd} onClick={() => exec("hiliteColor", "#f9731655")} title={ui.highlight}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 3H5.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Code */}
            <button type="button" className={cls(btnBase, btnIdle)} onMouseDown={pd} onClick={() => insertHtml("<code>code</code>")} title={ui.code}>
              <span className="font-mono text-xs font-semibold">&lt;/&gt;</span>
            </button>

            {/* Media separator */}
            {(onUploadInlineAsset || showYouTube) && (
              <div className="mx-0.5 h-5 w-px bg-[color:var(--border)]" />
            )}

            {/* Image upload */}
            {onUploadInlineAsset && (
              <>
                <label
                  htmlFor={imageInputId}
                  className={cls(btnBase, btnIdle, "cursor-pointer")}
                  title={ui.image}
                >
                  <span className="text-xs font-semibold">
                    {uploadingImage ? ui.uploading : "IMG"}
                  </span>
                </label>
                <input
                  id={imageInputId}
                  type="file"
                  accept="image/*,image/gif"
                  className="sr-only"
                  onChange={(e) => void handleImageUpload(e)}
                />
              </>
            )}

            {/* YouTube */}
            {showYouTube && (
              <button
                type="button"
                className={cls(
                  btnBase,
                  popover === "youtube" ? btnActive : btnIdle,
                )}
                onMouseDown={pd}
                onClick={() =>
                  openPopover(popover === "youtube" ? null : "youtube")
                }
                title={ui.youtube}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 0 1-1.75 1.75H2.75A1.75 1.75 0 0 1 1 15.265V4.75Zm12.3 5.68-4.5-2.9A.75.75 0 0 0 7.65 8.2v5.6a.75.75 0 0 0 1.15.63l4.5-2.9a.75.75 0 0 0 0-1.22v-.03Z" />
                </svg>
              </button>
            )}

            {toolbarSuffix && <div className="ml-auto">{toolbarSuffix}</div>}
          </div>

          {/* Inline popover */}
          {popover && (
            <InlinePopover
              kind={popover}
              locale={locale}
              onSubmit={
                popover === "link" ? handleLinkSubmit : handleYouTubeSubmit
              }
              onClose={() => setPopover(null)}
            />
          )}
        </div>

        {/* -------- Editor area -------- */}
        <div className="relative">
          {isEmpty && (
            <div className="pointer-events-none absolute inset-x-5 top-5 text-[color:var(--muted-foreground)]">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={cls(
              "rich-text-editor min-h-48 px-5 py-5 text-[color:var(--foreground)] outline-none",
              contentClassName,
            )}
            style={{ minHeight }}
            onFocus={() => {
              savedRangeRef.current = saveSelection();
              document.execCommand("defaultParagraphSeparator", false, "p");
            }}
            onBlur={() => {
              savedRangeRef.current = saveSelection();
              syncEditorValue();
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={trackSelection}
            onMouseUp={trackSelection}
            onInput={() => {
              trackSelection();
              syncEditorValue();
            }}
          />
        </div>
      </div>
    </div>
  );
}
