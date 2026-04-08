import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import LocalizedLink from "@/components/ui/localized-link";
import { buttonStyles } from "@/components/ui/button-styles";
import { buildProjectPath } from "@/lib/projects";

type ProjectCardData = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  ownerName?: string | null;
  ownerUsername?: string | null;
  score?: number | null;
  cover_url?: string | null;
};

export default function ProjectCard({
  dictionary,
  project,
}: {
  dictionary: Dictionary;
  project: ProjectCardData;
}) {
  const ownerLabel = project.ownerName || project.ownerUsername;
  const scoreLabel =
    typeof project.score === "number"
      ? `${project.score} ${dictionary.common.scoreSuffix}`
      : dictionary.common.fresh;

  return (
    <LocalizedLink
      href={buildProjectPath(project.id, project.slug)}
      className="group block overflow-hidden rounded-3xl app-card transition hover:-translate-y-0.5 hover:border-[color:var(--foreground)] hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] bg-[color:var(--surface-muted)]">
        {project.cover_url ? (
          <Image
            src={project.cover_url}
            alt={project.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.14),_transparent_45%),linear-gradient(135deg,_rgba(148,163,184,0.28),_rgba(255,255,255,0.8))] p-5">
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {dictionary.common.project}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] app-soft">
              {dictionary.common.project}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {project.title}
            </h3>
          </div>

          <span className="rounded-full app-panel px-3 py-1 text-xs font-medium app-muted">
            {scoreLabel}
          </span>
        </div>

        {project.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 app-muted">
            {project.description}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm app-muted">
            {ownerLabel
              ? `${dictionary.common.by} ${ownerLabel}`
              : dictionary.common.viewProject}
          </p>

          <span className={buttonStyles({ variant: "ghost", size: "sm" })}>
            {dictionary.common.viewProject}
          </span>
        </div>
      </div>
    </LocalizedLink>
  );
}
