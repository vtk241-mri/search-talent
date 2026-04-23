import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentDeleteButton from "@/components/admin/comment-delete-button";
import { buttonStyles } from "@/components/ui/button-styles";
import { getAdminCommentsList } from "@/lib/db/admin-content";
import { createLocalePath, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

const PER_PAGE = 25;
type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function resolveLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale);
  return buildMetadata({
    locale,
    pathname: "/admin/content/comments",
    title: `${dictionary.admin.content.commentsTitle} · ${dictionary.admin.shell.title}`,
    description: dictionary.admin.content.commentsDescription,
    noindex: true,
  });
}

export default async function AdminCommentsContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const locale = await resolveLocale(params);
  const resolvedSearchParams = await searchParams;
  const dictionary = getDictionary(locale);
  const copy = dictionary.admin.content;

  const kindParam = firstValue(resolvedSearchParams.kind);
  const pageParam = Number.parseInt(
    firstValue(resolvedSearchParams.page) || "1",
    10,
  );

  const kind: "all" | "article" | "project" =
    kindParam === "article" || kindParam === "project" ? kindParam : "all";

  const result = await getAdminCommentsList({
    kind,
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    perPage: PER_PAGE,
  });

  const pageCount = Math.max(1, Math.ceil(result.total / result.perPage));

  function buildFilterHref(nextKind: "all" | "article" | "project") {
    const qs = new URLSearchParams();
    if (nextKind !== "all") qs.set("kind", nextKind);
    const query = qs.toString();
    const path = createLocalePath(locale, "/admin/content/comments");
    return query ? `${path}?${query}` : path;
  }

  function buildPageHref(nextPage: number) {
    const qs = new URLSearchParams();
    if (kind !== "all") qs.set("kind", kind);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const query = qs.toString();
    const path = createLocalePath(locale, "/admin/content/comments");
    return query ? `${path}?${query}` : path;
  }

  function formatDate(value: string) {
    try {
      return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  const filterChips: Array<{
    value: "all" | "article" | "project";
    label: string;
  }> = [
    { value: "all", label: copy.filterAll },
    { value: "article", label: copy.typeArticle },
    { value: "project", label: copy.typeProject },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] app-card p-8">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
          {copy.commentsTitle}
        </h2>
        <p className="mt-2 max-w-3xl app-muted">{copy.commentsDescription}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center text-sm app-muted">
            {copy.filterType}:
          </span>
          {filterChips.map((chip) => {
            const active = chip.value === kind;
            return (
              <Link
                key={chip.value}
                href={buildFilterHref(chip.value)}
                className={[
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                    : "border border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-muted)]",
                ].join(" ")}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] app-card p-4 sm:p-6">
        {result.items.length === 0 ? (
          <div className="rounded-[1.5rem] app-panel-dashed p-8 text-center">
            <p className="text-sm app-muted">{copy.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] app-soft">
                  <th className="px-3 py-3">{copy.commentColumns.body}</th>
                  <th className="px-3 py-3">{copy.commentColumns.author}</th>
                  <th className="px-3 py-3">{copy.commentColumns.target}</th>
                  <th className="px-3 py-3">{copy.commentColumns.created}</th>
                  <th className="px-3 py-3 text-right">
                    {copy.commentColumns.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((comment) => (
                  <tr
                    key={`${comment.kind}-${comment.id}`}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-3 py-3">
                      <p className="max-w-md whitespace-pre-wrap text-[color:var(--foreground)]">
                        {comment.body}
                      </p>
                      <p className="mt-1 text-xs app-soft">
                        {comment.kind === "article"
                          ? copy.typeArticle
                          : copy.typeProject}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {comment.authorHref ? (
                        <Link
                          href={createLocalePath(locale, comment.authorHref)}
                          className="text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                        >
                          {comment.authorLabel}
                        </Link>
                      ) : (
                        <span className="app-muted">{comment.authorLabel}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {comment.targetHref ? (
                        <Link
                          href={createLocalePath(locale, comment.targetHref)}
                          className="text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                        >
                          {comment.targetLabel}
                        </Link>
                      ) : (
                        <span className="app-muted">{comment.targetLabel}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="app-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <CommentDeleteButton
                        commentId={comment.id}
                        kind={comment.kind}
                        labels={{
                          delete: copy.bulkBar.bulkDelete,
                          deleting: copy.bulkBar.applying,
                          confirmTitle: copy.confirmDeleteCommentTitle,
                          confirmMessage: copy.confirmDeleteCommentMessage,
                          confirmButton: copy.confirmBulkButton,
                          cancel: copy.cancel,
                          errorFallback: copy.errorFallback,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="mt-6 flex items-center justify-between gap-3 text-sm app-muted">
            <span>
              {dictionary.admin.users.pagination.page} {result.page}{" "}
              {dictionary.admin.users.pagination.of} {pageCount}
            </span>
            <div className="flex gap-2">
              {result.page > 1 ? (
                <Link
                  href={buildPageHref(result.page - 1)}
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                >
                  {dictionary.admin.users.pagination.previous}
                </Link>
              ) : null}
              {result.hasMore ? (
                <Link
                  href={buildPageHref(result.page + 1)}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  {dictionary.admin.users.pagination.next}
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
