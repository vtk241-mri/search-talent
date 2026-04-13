import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleInteractions from "@/components/article-interactions";
import ArticlePinButton from "@/components/article-pin-button";
import ReportArticleButton from "@/components/report-article-button";
import DeleteArticleButton from "@/components/delete-article-button";
import RichTextRenderer from "@/components/rich-text-renderer";
import { ButtonLink } from "@/components/ui/Button";
import { formatArticleDate, getArticleReadingTime, getCategoryDisplayName } from "@/lib/articles";
import { getArticleDetail } from "@/lib/db/articles";
import { isLocale } from "@/lib/i18n/config";
import { normalizeModerationStatus } from "@/lib/moderation";
import {
  buildMetadata,
  buildArticleSchema,
  buildBreadcrumbSchema,
  getMetadataBase,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getModerationLabel(status: string | null, locale: string) {
  switch (normalizeModerationStatus(status)) {
    case "under_review":
      return locale === "uk" ? "На перевірці" : "Under review";
    case "restricted":
      return locale === "uk" ? "Обмежено" : "Restricted";
    case "removed":
      return locale === "uk" ? "Прибрано" : "Removed";
    default:
      return locale === "uk" ? "Схвалено" : "Approved";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const data = await getArticleDetail(slug);

  return buildMetadata({
    locale: safeLocale,
    pathname: `/articles/${slug}`,
    title: data?.article.title || (safeLocale === "uk" ? "Стаття" : "Article"),
    description:
      data?.article.excerpt ||
      (safeLocale === "uk"
        ? "Детальна сторінка статті на SearchTalent."
        : "Article detail page on SearchTalent."),
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const data = await getArticleDetail(slug);

  if (!data) {
    notFound();
  }

  const { article, viewerUserId, isOwner, isAdmin } = data;
  const authorLabel = article.author?.name || article.author?.username || "SearchTalent";
  const authorInitial = authorLabel.slice(0, 1).toUpperCase();
  const isUkrainian = safeLocale === "uk";
  const ui = isUkrainian
    ? {
        back: "Усі статті",
        delete: "Видалити",
        deleting: "Видалення...",
        confirmDelete: "Видалити цю статтю?",
        deleteFailed: "Не вдалося видалити статтю.",
        by: "Автор",
        published: "Опубліковано",
        draft: "Чернетка",
        category: "Категорія",
        noCategory: "Без категорії",
        moderatorNote: "Нотатка модератора",
      }
    : {
        back: "All articles",
        delete: "Delete",
        deleting: "Deleting...",
        confirmDelete: "Delete this article?",
        deleteFailed: "Could not delete the article.",
        by: "Author",
        published: "Published",
        draft: "Draft",
        category: "Category",
        noCategory: "No category",
        moderatorNote: "Moderator note",
      };

  const siteUrl = getMetadataBase().toString().replace(/\/$/, "");
  const articleUrl = `${siteUrl}/${safeLocale}/articles/${slug}`;

  const articleSchema = buildArticleSchema({
    title: article.title,
    excerpt: article.excerpt || null,
    url: articleUrl,
    imageUrl: article.coverImageUrl || null,
    authorName: article.author?.name || article.author?.username || null,
    authorUrl: article.author?.username
      ? `${siteUrl}/${safeLocale}/u/${article.author.username}`
      : null,
    datePublished: article.publishedAt || article.createdAt || null,
    dateModified: null,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: isUkrainian ? "Головна" : "Home", url: `${siteUrl}/${safeLocale}` },
    {
      name: isUkrainian ? "Статті" : "Articles",
      url: `${siteUrl}/${safeLocale}/articles`,
    },
    { name: article.title, url: articleUrl },
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="rounded-[2.25rem] app-card">
        <div className="border-b app-border p-6 sm:p-8">
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/articles" variant="ghost">
              {ui.back}
            </ButtonLink>
            {!isOwner && viewerUserId && (
              <ReportArticleButton
                articleId={article.id}
                locale={safeLocale}
              />
            )}
            {isAdmin && (
              <ArticlePinButton
                articleId={article.id}
                currentPinnedUntil={article.pinnedUntil}
                locale={safeLocale}
              />
            )}
            {isOwner ? (
              <DeleteArticleButton
                articleId={article.id}
                label={ui.delete}
                pendingLabel={ui.deleting}
                confirmMessage={ui.confirmDelete}
                errorFallback={ui.deleteFailed}
                redirectHref="/articles/new"
                variant="secondary"
              />
            ) : null}
            {article.category ? (
              <span className="rounded-full bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                {getCategoryDisplayName(article.category, safeLocale)}
              </span>
            ) : null}
            {article.status === "draft" ? (
              <span className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium text-[color:var(--foreground)]">
                {ui.draft}
              </span>
            ) : null}
            {(isOwner || isAdmin) && (
              <span className="rounded-full border app-border px-4 py-2 text-sm app-muted">
                {getModerationLabel(article.moderationStatus, safeLocale)}
              </span>
            )}
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-5 text-lg leading-8 app-muted">{article.excerpt}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm app-muted">
            {article.author?.username ? (
              <Link
                href={`/${safeLocale}/u/${article.author.username}`}
                className="flex items-center gap-3 transition hover:opacity-80"
              >
                <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border app-border bg-[color:var(--surface-muted)] text-sm font-semibold text-[color:var(--foreground)]">
                  {article.author.avatarUrl ? (
                    <Image
                      src={article.author.avatarUrl}
                      alt={authorLabel}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>{authorInitial}</span>
                  )}
                </span>
                <span className="underline underline-offset-4 decoration-[color:var(--border)]">
                  {authorLabel}
                </span>
              </Link>
            ) : (
              <span className="flex items-center gap-3">
                <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border app-border bg-[color:var(--surface-muted)] text-sm font-semibold text-[color:var(--foreground)]">
                  <span>{authorInitial}</span>
                </span>
                <span>{authorLabel}</span>
              </span>
            )}
            <span>
              {ui.published}: {formatArticleDate(article.publishedAt || article.createdAt, safeLocale)}
            </span>
            <span>{getArticleReadingTime(article.content, safeLocale)}</span>
            <span>
              {ui.category}: {getCategoryDisplayName(article.category, safeLocale)}
            </span>
          </div>

          {(isOwner || isAdmin) && article.moderationNote ? (
            <div className="mt-5 rounded-[1.4rem] app-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] app-soft">
                {ui.moderatorNote}
              </p>
              <p className="mt-2 text-sm leading-7 app-muted">{article.moderationNote}</p>
            </div>
          ) : null}
        </div>

        {article.coverImageUrl ? (
          <div className="relative aspect-[16/8]">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        ) : article.heroVideoUrl ? (
          <video controls className="aspect-[16/8] w-full bg-black object-cover">
            <source src={article.heroVideoUrl} />
          </video>
        ) : null}

        <div className="grid gap-8 p-6 sm:p-8">
          <section className="space-y-6">
            <RichTextRenderer content={article.content} accentColor="#f97316" />
          </section>

          <ArticleInteractions
            locale={safeLocale}
            articleId={article.id}
            initialLikesCount={article.likesCount}
            initialViewsCount={article.viewsCount}
            initialLiked={article.currentUserLiked}
            comments={article.comments}
            isAuthenticated={Boolean(viewerUserId)}
          />
        </div>
      </div>
    </main>
  );
}
