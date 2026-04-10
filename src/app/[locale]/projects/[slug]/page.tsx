import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OptimizedImage from "@/components/ui/optimized-image";
import ProjectComments from "@/components/project-comments";
import ProjectGallery from "@/components/project-gallery";
import VoteButtons from "@/components/vote-buttons";
import { ButtonLink } from "@/components/ui/Button";
import { getPublicProjectPageData } from "@/lib/db/public";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

async function getRouteParams(
  params: Promise<{ locale: string; slug: string }>,
) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return {
    locale,
    slug,
  };
}

function getStatusLabel(
  status: string | null,
  dictionary: ReturnType<typeof getDictionary>,
) {
  switch (status) {
    case "planning":
      return dictionary.projectPage.planning;
    case "in_progress":
      return dictionary.projectPage.inProgress;
    case "completed":
      return dictionary.projectPage.completed;
    case "on_hold":
      return dictionary.projectPage.onHold;
    default:
      return null;
  }
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

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] app-panel p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] app-soft">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await getRouteParams(params);
  const dictionary = getDictionary(locale);
  const data = await getPublicProjectPageData(slug);

  return buildMetadata({
    locale,
    pathname: `/projects/${slug}`,
    title: data?.project.title || dictionary.metadata.projectDetail.title,
    description:
      data?.project.description || dictionary.metadata.projectDetail.description,
  });
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await getRouteParams(params);
  const dictionary = getDictionary(locale);
  const data = await getPublicProjectPageData(slug);

  if (!data) {
    notFound();
  }

  const { owner, project, technologies, media, voteSummary, isAuthenticated, isOwner } =
    data;
  const statusLabel = getStatusLabel(project.project_status, dictionary);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-[2.25rem] app-card">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/projects" variant="ghost" size="sm">
                {dictionary.projectPage.backToProjects}
              </ButtonLink>
              {owner?.username && (
                <ButtonLink href={`/u/${owner.username}`} variant="secondary" size="sm">
                  {dictionary.projectPage.viewCreator}
                </ButtonLink>
              )}
              {isOwner && (
                <ButtonLink href={`/projects/edit/${project.id}`} size="sm">
                  {dictionary.projectPage.manageProject}
                </ButtonLink>
              )}
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              {project.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-8 app-muted">
              {project.description || dictionary.projectPage.noDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full app-panel px-3 py-1 text-sm app-muted">
                {voteSummary.score} {dictionary.common.scoreSuffix}
              </span>
              {statusLabel && (
                <span className="rounded-full app-panel px-3 py-1 text-sm app-muted">
                  {statusLabel}
                </span>
              )}
              {owner && (
                <span className="rounded-full app-panel px-3 py-1 text-sm app-muted">
                  {dictionary.projectPage.createdBy}:{" "}
                  {owner.name || owner.username || dictionary.projectPage.creatorFallback}
                </span>
              )}
            </div>
          </div>

          <div className="relative min-h-[18rem] bg-[color:var(--surface-muted)]">
            {project.cover_url ? (
              <OptimizedImage
                src={project.cover_url}
                alt={project.title}
                fill
                sizePreset="cover"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.14),_transparent_45%),linear-gradient(135deg,_rgba(148,163,184,0.28),_rgba(255,255,255,0.8))] p-6">
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  {dictionary.common.project}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <section className="rounded-[2rem] app-card p-6">
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {dictionary.projectPage.details}
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {statusLabel && (
                <DetailCard label={dictionary.projectPage.status} value={statusLabel} />
              )}
              {project.role && (
                <DetailCard label={dictionary.projectPage.role} value={project.role} />
              )}
              {typeof project.team_size === "number" && (
                <DetailCard
                  label={dictionary.projectPage.teamSize}
                  value={String(project.team_size)}
                />
              )}
              {(project.started_on || project.completed_on) && (
                <DetailCard
                  label={dictionary.projectPage.timeline}
                  value={[
                    formatDate(project.started_on, locale)
                      ? `${dictionary.projectPage.startedOn}: ${formatDate(project.started_on, locale)}`
                      : null,
                    formatDate(project.completed_on, locale)
                      ? `${dictionary.projectPage.completedOn}: ${formatDate(project.completed_on, locale)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                />
              )}
            </div>

            {technologies.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-[color:var(--foreground)]">
                  {dictionary.projectPage.technologies}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {technologies.map((technology) => (
                    <span
                      key={technology.id}
                      className="rounded-full border app-border px-3 py-1 text-sm text-[color:var(--foreground)]"
                    >
                      {technology.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(project.project_url || project.repository_url) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border app-border px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]"
                  >
                    {dictionary.projectPage.liveProject}
                  </a>
                )}
                {project.repository_url && (
                  <a
                    href={project.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border app-border px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]"
                  >
                    {dictionary.projectPage.repository}
                  </a>
                )}
              </div>
            )}
          </section>

          {(project.problem || project.solution || project.results) && (
            <section className="grid gap-4 lg:grid-cols-3">
              {project.problem && (
                <article className="rounded-[2rem] app-card p-6">
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {dictionary.projectPage.problem}
                  </h2>
                  <p className="mt-4 text-sm leading-7 app-muted">{project.problem}</p>
                </article>
              )}
              {project.solution && (
                <article className="rounded-[2rem] app-card p-6">
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {dictionary.projectPage.solution}
                  </h2>
                  <p className="mt-4 text-sm leading-7 app-muted">{project.solution}</p>
                </article>
              )}
              {project.results && (
                <article className="rounded-[2rem] app-card p-6">
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {dictionary.projectPage.results}
                  </h2>
                  <p className="mt-4 text-sm leading-7 app-muted">{project.results}</p>
                </article>
              )}
            </section>
          )}

          <section className="rounded-[2rem] app-card p-6">
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {dictionary.projectPage.gallery}
            </h2>
            <div className="mt-6">
              <ProjectGallery media={media} />
            </div>
          </section>

          <ProjectComments
            projectId={project.id}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <VoteButtons
            projectId={project.id}
            initialVote={voteSummary.currentVote}
            initialLikes={voteSummary.likes}
            initialDislikes={voteSummary.dislikes}
            isAuthenticated={isAuthenticated}
          />

          {owner && (
            <section className="rounded-[2rem] app-card p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] app-soft">
                {dictionary.projectPage.createdBy}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full app-panel text-lg font-semibold text-[color:var(--foreground)]">
                  {owner.avatarUrl ? (
                    <OptimizedImage
                      src={owner.avatarUrl}
                      alt={owner.name || owner.username || dictionary.projectPage.creatorFallback}
                      fill
                      sizePreset="avatar"
                      className="object-cover"
                    />
                  ) : (
                    <span>
                      {(owner.name || owner.username || dictionary.projectPage.creatorFallback)
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-[color:var(--foreground)]">
                    {owner.name || owner.username || dictionary.projectPage.creatorFallback}
                  </p>
                  {owner.headline && (
                    <p className="truncate text-sm app-muted">{owner.headline}</p>
                  )}
                  {(owner.city || owner.countryName) && (
                    <p className="truncate text-sm app-muted">
                      {[owner.city, owner.countryName].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {owner.username && (
                <div className="mt-5">
                  <ButtonLink href={`/u/${owner.username}`} variant="secondary" size="sm">
                    {dictionary.projectPage.viewCreator}
                  </ButtonLink>
                </div>
              )}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
