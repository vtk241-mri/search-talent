"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import FormTextarea from "@/components/ui/form-textarea";
import OptimizedImage from "@/components/ui/optimized-image";
import { createLocalePath } from "@/lib/i18n/config";
import type { ArticleComment } from "@/lib/articles";

function countComments(comments: ArticleComment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countComments(comment.replies),
    0,
  );
}

function formatCommentDate(value: string | null, locale: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function CommentThread({
  comments,
  locale,
  canComment,
  articleId,
  onCommentPosted,
}: {
  comments: ArticleComment[];
  locale: string;
  canComment: boolean;
  articleId: string;
  onCommentPosted: () => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);
  const replyLabel = locale === "uk" ? "Відповісти" : "Reply";
  const replyPlaceholder =
    locale === "uk" ? "Напишіть відповідь..." : "Write a reply...";
  const sendLabel = locale === "uk" ? "Надіслати" : "Send";

  const submitReply = async (parentId: string) => {
    const body = replyDrafts[parentId]?.trim();

    if (!body) {
      return;
    }

    setSubmittingFor(parentId);

    const response = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
        parent_id: parentId,
      }),
    });

    setSubmittingFor(null);

    if (!response.ok) {
      return;
    }

    setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
    setReplyingTo(null);
    onCommentPosted();
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-[1.5rem] app-panel p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
              {comment.author?.avatarUrl ? (
                <OptimizedImage
                  src={comment.author.avatarUrl}
                  alt={
                    comment.author.name || comment.author.username || "author"
                  }
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[color:var(--foreground)]">
                  {comment.authorDeleted
                    ? locale === "uk"
                      ? "Видалений користувач"
                      : "Deleted user"
                    : comment.author?.name ||
                      comment.author?.username ||
                      (locale === "uk" ? "Користувач" : "User")}
                </p>
                {comment.createdAt ? (
                  <span className="text-xs app-soft">
                    {formatCommentDate(comment.createdAt, locale)}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 app-muted">{comment.body}</p>

              {canComment ? (
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-[color:var(--foreground)]"
                    onClick={() =>
                      setReplyingTo((prev) =>
                        prev === comment.id ? null : comment.id,
                      )
                    }
                  >
                    {replyLabel}
                  </button>
                  {replyingTo === comment.id ? (
                    <div className="mt-3 space-y-3">
                      <FormTextarea
                        className="min-h-24 w-full p-4 text-sm text-[color:var(--foreground)]"
                        placeholder={replyPlaceholder}
                        value={replyDrafts[comment.id] || ""}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [comment.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => void submitReply(comment.id)}
                        disabled={submittingFor === comment.id}
                      >
                        {sendLabel}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {comment.replies.length > 0 ? (
                <div className="mt-4 border-l app-border pl-4">
                  <CommentThread
                    comments={comment.replies}
                    locale={locale}
                    canComment={canComment}
                    articleId={articleId}
                    onCommentPosted={onCommentPosted}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArticleInteractions({
  locale,
  articleId,
  initialLikesCount,
  initialViewsCount,
  initialLiked,
  comments,
  isAuthenticated,
}: {
  locale: string;
  articleId: string;
  initialLikesCount: number;
  initialViewsCount: number;
  initialLiked: boolean;
  comments: ArticleComment[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const loginPath = createLocalePath(locale === "uk" ? "uk" : "en", "/login");
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [viewsCount, setViewsCount] = useState(initialViewsCount);
  const [liked, setLiked] = useState(initialLiked);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingLike, setSubmittingLike] = useState(false);
  const totalCommentCount = countComments(comments);

  useEffect(() => {
    const storageKey = `article-viewed:${articleId}`;

    if (window.localStorage.getItem(storageKey)) {
      return;
    }

    void fetch(`/api/articles/${articleId}/view`, {
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as { viewsCount?: number };
      })
      .then((payload) => {
        if (payload?.viewsCount) {
          setViewsCount(payload.viewsCount);
          window.localStorage.setItem(storageKey, "1");
        }
      });
  }, [articleId]);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      router.push(loginPath);
      return;
    }

    setSubmittingLike(true);

    const response = await fetch(`/api/articles/${articleId}/like`, {
      method: "POST",
    });

    setSubmittingLike(false);

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      liked?: boolean;
      likesCount?: number;
    };

    setLiked(Boolean(payload.liked));
    setLikesCount(payload.likesCount ?? likesCount);
  };

  const submitComment = async () => {
    const body = commentBody.trim();

    if (!body || !isAuthenticated) {
      if (!isAuthenticated) {
        router.push(loginPath);
      }

      return;
    }

    setSubmittingComment(true);

    const response = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
        parent_id: null,
      }),
    });

    setSubmittingComment(false);

    if (!response.ok) {
      return;
    }

    setCommentBody("");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Button
          variant={liked ? "primary" : "secondary"}
          onClick={() => void toggleLike()}
          disabled={submittingLike}
        >
          {locale === "uk" ? "Подобається" : "Like"} ({likesCount})
        </Button>
        <span className="rounded-full app-panel px-4 py-2 text-sm app-muted">
          {locale === "uk" ? "Перегляди" : "Views"}: {viewsCount}
        </span>
        <span className="rounded-full app-panel px-4 py-2 text-sm app-muted">
          {locale === "uk" ? "Коментарі" : "Comments"}: {totalCommentCount}
        </span>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
            {locale === "uk" ? "Обговорення" : "Discussion"}
          </h2>
          <p className="mt-2 text-sm app-muted">
            {locale === "uk"
              ? "Можна залишати коментарі та відповідати в треді."
              : "Leave a comment and reply in threads."}
          </p>
        </div>

        <div className="rounded-[1.75rem] app-card p-5">
          <FormTextarea
            className="min-h-32 w-full p-4 text-sm text-[color:var(--foreground)]"
            placeholder={
              locale === "uk"
                ? "Поділіться думкою про статтю..."
                : "Share your thoughts about the article..."
            }
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => void submitComment()}
              disabled={submittingComment}
            >
              {locale === "uk" ? "Опублікувати коментар" : "Post comment"}
            </Button>
          </div>
        </div>

        {comments.length > 0 ? (
          <CommentThread
            comments={comments}
            locale={locale}
            canComment={isAuthenticated}
            articleId={articleId}
            onCommentPosted={() => router.refresh()}
          />
        ) : (
          <p className="rounded-[1.5rem] app-panel-dashed p-5 text-sm app-muted">
            {locale === "uk"
              ? "Поки що коментарів немає. Можна почати обговорення першим."
              : "No comments yet. Start the discussion first."}
          </p>
        )}
      </section>
    </div>
  );
}
