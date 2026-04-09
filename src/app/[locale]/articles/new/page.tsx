import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import DeleteArticleButton from "@/components/delete-article-button";
import { ButtonLink } from "@/components/ui/Button";
import { getCategoryDisplayName } from "@/lib/articles";
import { getDashboardArticles } from "@/lib/db/articles";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { normalizeModerationStatus } from "@/lib/moderation";

const ArticleComposer = nextDynamic(
  () => import("@/components/article-composer"),
  {
    loading: () => (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-12 w-2/3 rounded-xl bg-[color:var(--surface-muted)]" />
        <div className="h-64 rounded-xl bg-[color:var(--surface-muted)]" />
      </div>
    ),
  },
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getModerationBadge(status: string | null, locale: string) {
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

export default async function NewArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const viewer = await getCurrentViewerRole();

  if (!viewer.user) {
    redirect(createLocalePath(safeLocale, "/login"));
  }

  const dashboard = await getDashboardArticles();

  if (!dashboard) {
    redirect(createLocalePath(safeLocale, "/dashboard"));
  }

  const ui =
    safeLocale === "uk"
      ? {
          title: "Нова стаття",
          description:
            "Окремий простір для створення матеріалів без прив'язки до дашборду. Ліворуч редактор, праворуч параметри публікації, а нижче ваші матеріали та їхній статус модерації.",
          myArticles: "Мої статті",
          openFeed: "Відкрити статті",
          openModeration: "Модерація статей",
          empty: "У вас ще немає статей. Можна почати з чернетки нижче.",
          draft: "Чернетка",
          published: "Опубліковано",
          openArticle: "Відкрити статтю",
          editArticle: "Редагувати",
          views: "Перегляди",
          likes: "Лайки",
          comments: "Коментарі",
          note: "Нотатка модератора",
          noCategory: "Без категорії",
          delete: "Видалити",
          deleting: "Видалення...",
          confirmDelete: "Видалити цю статтю?",
          deleteFailed: "Не вдалося видалити статтю.",
        }
      : {
          title: "New article",
          description:
            "A dedicated writing space outside the dashboard. Use the editor canvas below, tune publishing settings on the side, and manage your existing posts from the same page.",
          myArticles: "My articles",
          openFeed: "Open articles",
          openModeration: "Article moderation",
          empty: "You do not have any articles yet. Start with a draft below.",
          draft: "Draft",
          published: "Published",
          openArticle: "Open article",
          editArticle: "Edit",
          views: "Views",
          likes: "Likes",
          comments: "Comments",
          note: "Moderator note",
          noCategory: "No category",
          delete: "Delete",
          deleting: "Deleting...",
          confirmDelete: "Delete this article?",
          deleteFailed: "Could not delete the article.",
        };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.25rem] app-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              {ui.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 app-muted">
              {ui.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/articles" variant="secondary">
              {ui.openFeed}
            </ButtonLink>
            {viewer.isAdmin ? (
              <ButtonLink href="/articles/moderation" variant="ghost">
                {ui.openModeration}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-8">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {ui.myArticles}
            </h2>
          </div>

          {dashboard.items.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {dashboard.items.map((item) => (
                <article key={item.id} className="rounded-[1.75rem] app-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm app-muted">
                        {getCategoryDisplayName(item.category, safeLocale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full app-panel px-4 py-2 text-sm app-muted">
                        {item.status === "published" ? ui.published : ui.draft}
                      </span>
                      <span className="rounded-full border app-border px-4 py-2 text-sm app-muted">
                        {getModerationBadge(item.moderationStatus, safeLocale)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm app-muted">
                    <span>
                      {ui.views}: {item.viewsCount}
                    </span>
                    <span>
                      {ui.likes}: {item.likesCount}
                    </span>
                    <span>
                      {ui.comments}: {item.commentsCount}
                    </span>
                  </div>

                  {item.moderationNote ? (
                    <div className="mt-4 rounded-[1.25rem] app-panel p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] app-soft">
                        {ui.note}
                      </p>
                      <p className="mt-2 text-sm leading-7 app-muted">{item.moderationNote}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink href={`/articles/${item.slug}`} variant="ghost" size="sm">
                      {ui.openArticle}
                    </ButtonLink>
                    {item.status === "draft" && (
                      <ButtonLink href={`/articles/edit/${item.id}`} variant="ghost" size="sm">
                        {ui.editArticle}
                      </ButtonLink>
                    )}
                    <DeleteArticleButton
                      articleId={item.id}
                      label={ui.delete}
                      pendingLabel={ui.deleting}
                      confirmMessage={ui.confirmDelete}
                      errorFallback={ui.deleteFailed}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-[1.75rem] app-panel-dashed p-6 text-sm app-muted">
              {ui.empty}
            </p>
          )}
        </div>

        <ArticleComposer
          locale={safeLocale}
          userId={dashboard.userId}
          categories={dashboard.categories}
          isAdmin={viewer.isAdmin}
        />
      </section>
    </main>
  );
}
