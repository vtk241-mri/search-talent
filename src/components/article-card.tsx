import Image from "next/image";
import LocalizedLink from "@/components/ui/localized-link";
import {
  formatArticleDate,
  getArticleReadingTime,
  getCategoryDisplayName,
  type ArticleFeedItem,
} from "@/lib/articles";

export default function ArticleCard({
  article,
  locale,
}: {
  article: ArticleFeedItem;
  locale: string;
}) {
  const isUkrainian = locale === "uk";
  const authorLabel =
    article.author?.name || article.author?.username || (isUkrainian ? "Автор" : "Author");
  const authorInitial = authorLabel.slice(0, 1).toUpperCase();
  const publishedLabel = formatArticleDate(article.publishedAt || article.createdAt, locale);
  const readingTime = getArticleReadingTime(article.content || article.excerpt || "", locale);
  const categoryLabel = getCategoryDisplayName(article.category, locale) || (isUkrainian ? "Стаття" : "Article");
  const isPinned = article.pinnedUntil && new Date(article.pinnedUntil) > new Date();

  return (
    <LocalizedLink
      href={`/articles/${article.slug}`}
      className="group block overflow-hidden rounded-[2rem] app-card transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] bg-[color:var(--surface-muted)]">
        {isPinned && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-orange-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {isUkrainian ? "Закріплено" : "Pinned"}
          </span>
        )}
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : article.heroVideoUrl ? (
          <video
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <source src={article.heroVideoUrl} />
          </video>
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.24),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,0.9),_rgba(30,41,59,0.88))] p-5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {categoryLabel}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] app-soft">
          <span>{categoryLabel}</span>
          <span>•</span>
          <span>{publishedLabel}</span>
        </div>

        <h3 className="mt-3 text-xl font-semibold text-[color:var(--foreground)]">
          {article.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-7 app-muted">
          {article.excerpt || article.content || ""}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm app-muted">
          <span className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border app-border bg-[color:var(--surface-muted)] text-xs font-semibold text-[color:var(--foreground)]">
              {article.author?.avatarUrl ? (
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
            <span>{authorLabel}</span>
          </span>
          <span>•</span>
          <span>{readingTime}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <span className="app-muted">
            {isUkrainian ? "Перегляди" : "Views"}: {article.viewsCount}
          </span>
          <span className="app-muted">
            {isUkrainian ? "Лайки" : "Likes"}: {article.likesCount}
          </span>
          <span className="app-muted">
            {isUkrainian ? "Коментарі" : "Comments"}: {article.commentsCount}
          </span>
        </div>
      </div>
    </LocalizedLink>
  );
}
