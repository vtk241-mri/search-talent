import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import DeleteProjectButton from "@/components/delete-project-button";

const CreateProjectForm = dynamic(
  () => import("@/components/create-project-form"),
  {
    loading: () => (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-10 w-1/2 rounded-xl bg-[color:var(--surface-muted)]" />
        <div className="h-48 rounded-xl bg-[color:var(--surface-muted)]" />
      </div>
    ),
  },
);
import { ButtonLink } from "@/components/ui/Button";
import { getMyProjectsPage } from "@/lib/db/projects";
import { normalizeModerationStatus } from "@/lib/moderation";
import { buildProjectPath } from "@/lib/projects";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

async function getLocaleValue(params: Promise<{ locale: string }>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return locale;
}

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function formatModerationBadge(status: string | null, locale: string) {
  switch (normalizeModerationStatus(status)) {
    case "under_review":
      return locale === "uk" ? "На перевірці" : "Under review";
    case "restricted":
      return locale === "uk" ? "Обмежено" : "Restricted";
    case "removed":
      return locale === "uk" ? "Прибрано" : "Removed";
    default:
      return locale === "uk" ? "Публічний" : "Public";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await getLocaleValue(params);
  const dictionary = getDictionary(locale);

  return buildMetadata({
    locale,
    pathname: "/dashboard/projects",
    title: dictionary.metadata.dashboardProjects.title,
    description: dictionary.metadata.dashboardProjects.description,
  });
}

export default async function DashboardProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getLocaleValue(params);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(createLocalePath(locale, "/login"));
  }

  const dictionary = getDictionary(locale);
  const { page } = await searchParams;
  const requestedPage = Number.parseInt(page || "1", 10);
  const result = await getMyProjectsPage({
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    perPage: 9,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.25rem] app-card p-8 sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] app-soft">
              {dictionary.dashboardProjects.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {dictionary.dashboardProjects.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 app-muted">
              {dictionary.dashboardProjects.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="ghost">
              {dictionary.dashboardProjects.backToDashboard}
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              {dictionary.dashboardProjects.publicCatalog}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] app-panel p-5">
          <CreateProjectForm />
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] app-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {dictionary.dashboardProjects.title}
            </h2>
            <p className="mt-2 text-sm app-muted">
              {dictionary.dashboardProjects.showingResults} {result.projects.length} /{" "}
              {result.totalCount}
            </p>
          </div>
        </div>

        {result.projects.length > 0 ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.projects.map((project) => {
                const publicHref = buildProjectPath(project.id, project.slug || undefined);

                return (
                  <article key={project.id} className="rounded-[1.75rem] app-panel p-5">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-[color:var(--surface-muted)]">
                      {project.cover_url ? (
                        <Image
                          src={project.cover_url}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.14),_transparent_45%),linear-gradient(135deg,_rgba(148,163,184,0.28),_rgba(255,255,255,0.8))] p-4">
                          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                            {dictionary.dashboardProjects.preview}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-[color:var(--foreground)]">
                          {project.title}
                        </h3>
                        <p className="mt-2 text-sm app-muted">
                          {dictionary.dashboardProjects.createdOn}:{" "}
                          {formatDate(project.created_at, locale) || "—"}
                        </p>
                      </div>
                      <span className="rounded-full border app-border px-3 py-1 text-xs font-medium app-soft">
                        {formatModerationBadge(project.moderation_status, locale)}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <ButtonLink href={`/projects/edit/${project.id}`} size="sm">
                        {dictionary.dashboardProjects.editProject}
                      </ButtonLink>
                      <ButtonLink href={publicHref} variant="secondary" size="sm">
                        {dictionary.dashboardProjects.openPublicPage}
                      </ButtonLink>
                    </div>

                    <div className="mt-3">
                      <DeleteProjectButton
                        projectId={project.id}
                        label={dictionary.dashboardProjects.deleteProject}
                        pendingLabel={dictionary.dashboardProjects.deletingProject}
                        confirmMessage={dictionary.dashboardProjects.confirmDeleteProject}
                        errorFallback={dictionary.dashboardProjects.deleteProjectFailed}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm app-muted">
                {dictionary.dashboardProjects.pageLabel} {result.currentPage} /{" "}
                {result.totalPages}
              </span>

              <div className="flex gap-3">
                {result.currentPage > 1 && (
                  <ButtonLink
                    href={`/dashboard/projects?page=${result.currentPage - 1}`}
                    variant="ghost"
                    size="sm"
                  >
                    {dictionary.dashboardProjects.previousPage}
                  </ButtonLink>
                )}

                {result.currentPage < result.totalPages && (
                  <ButtonLink
                    href={`/dashboard/projects?page=${result.currentPage + 1}`}
                    variant="secondary"
                    size="sm"
                  >
                    {dictionary.dashboardProjects.nextPage}
                  </ButtonLink>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-[1.75rem] app-panel-dashed p-6">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
              {dictionary.dashboardProjects.emptyTitle}
            </h2>
            <p className="mt-2 text-sm leading-7 app-muted">
              {dictionary.dashboardProjects.emptyDescription}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
