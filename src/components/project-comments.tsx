"use client";

import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDictionary, useLocalizedRouter } from "@/lib/i18n/client";

type Comment = {
  id: string;
  project_id: string;
  author_user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author: {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
};

type ProjectCommentsProps = {
  projectId: string;
  isAuthenticated: boolean;
};

function formatRelativeTime(isoDate: string, locale: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return locale === "uk" ? "щойно" : "just now";
  }

  if (diffMinutes < 60) {
    return locale === "uk"
      ? `${diffMinutes} хв тому`
      : `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return locale === "uk"
      ? `${diffHours} год тому`
      : `${diffHours}h ago`;
  }

  if (diffDays < 30) {
    return locale === "uk" ? `${diffDays} дн тому` : `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function buildCommentTree(comments: Comment[]) {
  const topLevel: Comment[] = [];
  const childrenMap = new Map<string, Comment[]>();

  for (const comment of comments) {
    if (comment.parent_id) {
      const siblings = childrenMap.get(comment.parent_id) || [];
      siblings.push(comment);
      childrenMap.set(comment.parent_id, siblings);
    } else {
      topLevel.push(comment);
    }
  }

  return { topLevel, childrenMap };
}

function CommentItem({
  comment,
  replies,
  locale,
  isAuthenticated,
  onReply,
  replyingTo,
  replyBody,
  onReplyBodyChange,
  onSubmitReply,
  submitting,
  dictionary,
}: {
  comment: Comment;
  replies?: Comment[];
  locale: string;
  isAuthenticated: boolean;
  onReply: (id: string | null) => void;
  replyingTo: string | null;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSubmitReply: () => void;
  submitting: boolean;
  dictionary: ReturnType<typeof useDictionary>;
}) {
  const authorName =
    comment.author.name || comment.author.username || dictionary.projectComments.anonymous;

  return (
    <div className="group">
      <div className="flex gap-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full app-panel text-xs font-semibold text-[color:var(--foreground)]">
          {comment.author.avatar_url ? (
            <Image
              src={comment.author.avatar_url}
              alt={authorName}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <span>{authorName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-[color:var(--foreground)]">
              {authorName}
            </span>
            <span className="text-xs app-muted">
              {formatRelativeTime(comment.created_at, locale)}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 app-muted whitespace-pre-line">
            {comment.body}
          </p>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() =>
                onReply(replyingTo === comment.id ? null : comment.id)
              }
              className="mt-1 text-xs font-medium app-soft hover:text-[color:var(--foreground)] transition-colors"
            >
              {dictionary.projectComments.reply}
            </button>
          )}

          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => onReplyBodyChange(e.target.value)}
                placeholder={dictionary.projectComments.replyPlaceholder}
                rows={2}
                className="w-full rounded-xl border app-border bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:app-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={onSubmitReply}
                  disabled={submitting || !replyBody.trim()}
                  size="sm"
                >
                  {submitting
                    ? dictionary.projectComments.sending
                    : dictionary.projectComments.send}
                </Button>
                <Button
                  onClick={() => onReply(null)}
                  variant="ghost"
                  size="sm"
                >
                  {dictionary.projectComments.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies && replies.length > 0 && (
        <div className="ml-11 mt-4 space-y-4 border-l app-border pl-4">
          {replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              locale={locale}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
              replyingTo={replyingTo}
              replyBody={replyBody}
              onReplyBodyChange={onReplyBodyChange}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              dictionary={dictionary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectComments({
  projectId,
  isAuthenticated,
}: ProjectCommentsProps) {
  const dictionary = useDictionary();
  const router = useLocalizedRouter();
  const locale = router.locale;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
      })
      .catch(() => {
        setError(dictionary.projectComments.loadError);
      })
      .finally(() => setLoading(false));
  }, [projectId, dictionary.projectComments.loadError]);

  const submitComment = async (parentId: string | null = null) => {
    const text = parentId ? replyBody : body;

    if (!text.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, parent_id: parentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || dictionary.projectComments.submitError);
        return;
      }

      if (parentId) {
        setReplyBody("");
        setReplyingTo(null);
      } else {
        setBody("");
      }

      const refreshResponse = await fetch(
        `/api/projects/${projectId}/comments`,
      );
      const refreshData = await refreshResponse.json();
      setComments(refreshData.comments || []);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(dictionary.projectComments.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const { topLevel, childrenMap } = buildCommentTree(comments);

  return (
    <section className="rounded-[2rem] app-card p-6">
      <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
        {dictionary.projectComments.title}
        {comments.length > 0 && (
          <span className="ml-2 text-base font-normal app-muted">
            ({comments.length})
          </span>
        )}
      </h2>

      {isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={dictionary.projectComments.placeholder}
            rows={3}
            maxLength={4000}
            className="w-full rounded-xl border app-border bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--foreground)] placeholder:app-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] resize-none"
          />
          <Button
            onClick={() => submitComment(null)}
            disabled={submitting || !body.trim()}
          >
            {submitting
              ? dictionary.projectComments.sending
              : dictionary.projectComments.send}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm app-muted">
          {dictionary.projectComments.signInToComment}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm app-muted">
          {dictionary.projectComments.loading}
        </p>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-sm app-muted">
          {dictionary.projectComments.noComments}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={childrenMap.get(comment.id)}
              locale={locale}
              isAuthenticated={isAuthenticated}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              replyBody={replyBody}
              onReplyBodyChange={setReplyBody}
              onSubmitReply={() => submitComment(replyingTo)}
              submitting={submitting}
              dictionary={dictionary}
            />
          ))}
        </div>
      )}
    </section>
  );
}
