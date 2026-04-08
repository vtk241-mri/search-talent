import type { Metadata } from "next";
import ArticleCard from "@/components/article-card";
import { ButtonLink } from "@/components/ui/Button";
import { getArticleFeed } from "@/lib/db/articles";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildMetadata({
    locale: isLocale(locale) ? locale : "en",
    pathname: "/articles",
    title: locale === "uk" ? "Статті та публікації" : "Articles and updates",
    description:
      locale === "uk"
        ? "Публікації команди й авторів SearchTalent: новини платформи, авторські матеріали, кейси й гайди."
        : "SearchTalent writing hub with platform updates, authored posts, case studies, and guides.",
  });
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    author?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  const { category, author, sort } = await searchParams;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = getDictionary(safeLocale);
  const feed = await getArticleFeed({
    categorySlug: category || null,
    authorQuery: author || null,
    sort: sort || null,
  });
  const ui =
    safeLocale === "uk"
      ? {
          eyebrow: "Редакційний простір",
          title: "Статті, новини та авторські тексти",
          description:
            "Окремий простір для новин платформи, авторських матеріалів, гайдів і кейсів. Тут можна читати оновлення, відстежувати активних авторів і переходити в глибші обговорення.",
          filterCategory: "Категорія",
          filterAuthor: "Автор",
          filterSort: "Сортування",
          authorPlaceholder: "Пошук за автором",
          allCategories: "Усі категорії",
          recent: "Найновіші",
          popular: "Популярні",
          discussed: "Обговорювані",
          apply: "Застосувати",
          reset: "Скинути фільтри",
          createArticle: "Створити статтю",
          empty: "Поки що немає статей під ці фільтри.",
        }
      : {
          eyebrow: "Editorial space",
          title: "Articles, platform updates, and authored posts",
          description:
            "A dedicated space for platform news, authored essays, guides, and case studies. Read what is new, discover active writers, and jump into deeper discussions.",
          filterCategory: "Category",
          filterAuthor: "Author",
          filterSort: "Sort",
          authorPlaceholder: "Search by author",
          allCategories: "All categories",
          recent: "Recent",
          popular: "Popular",
          discussed: "Discussed",
          apply: "Apply filters",
          reset: "Reset filters",
          createArticle: "Write an article",
          empty: "No articles match these filters yet.",
        };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-[2.25rem] app-card">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
              {ui.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
              {ui.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 app-muted">
              {ui.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/articles/new">{ui.createArticle}</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                {dictionary.projectsPage.title}
              </ButtonLink>
            </div>
          </div>

          <div className="border-l app-border bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.22),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.72))] p-6 sm:p-8">
            <form className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  {ui.filterCategory}
                </label>
                <select
                  name="category"
                  defaultValue={category || ""}
                  className="w-full rounded-[1.25rem] border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                >
                  <option value="">{ui.allCategories}</option>
                  {feed.categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  {ui.filterAuthor}
                </label>
                <input
                  name="author"
                  defaultValue={author || ""}
                  placeholder={ui.authorPlaceholder}
                  className="w-full rounded-[1.25rem] border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  {ui.filterSort}
                </label>
                <select
                  name="sort"
                  defaultValue={sort || "recent"}
                  className="w-full rounded-[1.25rem] border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                >
                  <option value="recent">{ui.recent}</option>
                  <option value="popular">{ui.popular}</option>
                  <option value="discussed">{ui.discussed}</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-[color:var(--foreground)] px-5 py-2.5 text-sm font-medium text-[color:var(--background)]">
                  {ui.apply}
                </button>
                <ButtonLink href="/articles" variant="ghost">
                  {ui.reset}
                </ButtonLink>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-8">
        {feed.items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {feed.items.map((article) => (
              <ArticleCard key={article.id} article={article} locale={safeLocale} />
            ))}
          </div>
        ) : (
          <p className="rounded-[1.75rem] app-panel-dashed p-6 text-sm app-muted">
            {ui.empty}
          </p>
        )}
      </section>
    </main>
  );
}
