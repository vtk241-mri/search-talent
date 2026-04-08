import { ButtonLink } from "@/components/ui/Button";
import type { DashboardStats } from "@/lib/db/dashboard";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getModerationCopy } from "@/lib/moderation-copy";
import { buildProjectPath, type ProjectStatus } from "@/lib/projects";

function formatCompactNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatMonthLabel(value: string, locale: Locale) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    month: "short",
  }).format(date);
}

function getDashboardUi(locale: Locale) {
  if (locale === "uk") {
    return {
      heroEyebrow: "Аналітика платформи",
      heroTitle: "Загальна картина платформи",
      heroDescription:
        "Тут видно, як росте платформа: скільки з'являється нових профілів і проєктів, які напрямки та країни активніші за інші, і наскільки добре заповнені профілі.",
      openProfile: "Редагувати профіль",
      manageProjects: "Керувати проєктами",
      openSearch: "Відкрити пошук",
      publicProfiles: "Публічні профілі",
      creatorDirections: "Напрямки",
      creatorCountries: "Країни",
      avgProfileCompletion: "Середня повнота профілю",
      avgProjectScore: "Середній score проєкту",
      creatorOrigins: "Географія фахівців",
      creatorDirectionsMix: "Розподіл за напрямками",
      profileReadiness: "Якість профілів",
      skillsUniverse: "Карта скілів платформи",
      skillsDescription:
        "Мапа поєднує навички з профілів і технології з проєктів, тому тут видно реальний стек платформи.",
      starter: "Стартовий рівень",
      growing: "Ростуть",
      complete: "Сильні профілі",
      topProjectsTitle: "Найсильніші проєкти платформи",
      topProjectsDescription:
        "Тут лише те, що справді цікаво: реакція аудиторії, автор і напрямок, без шуму про файли.",
      directionLabel: "Напрямок",
      ownerLabel: "Автор",
    };
  }

  return {
    heroEyebrow: "Platform intelligence",
    heroTitle: "Site-wide platform analytics",
    heroDescription:
      "One screen with the key platform signals: profile growth, active countries and directions, profile quality, and the skills that appear most often.",
    openProfile: "Edit profile",
    manageProjects: "Manage projects",
    openSearch: "Open search",
    publicProfiles: "Public profiles",
    creatorDirections: "Directions",
    creatorCountries: "Countries",
    avgProfileCompletion: "Average profile completion",
    avgProjectScore: "Average project score",
    creatorOrigins: "Talent geography",
    creatorDirectionsMix: "Direction distribution",
    profileReadiness: "Profile readiness",
    skillsUniverse: "Platform skill map",
    skillsDescription:
      "This combines profile skills with project technologies so the map reflects the actual platform stack.",
    starter: "Starter",
    growing: "Growing",
    complete: "Strong profiles",
    topProjectsTitle: "Strongest projects across the platform",
    topProjectsDescription:
      "Only the useful signals stay here: audience response, owner, and direction without noisy file stats.",
    directionLabel: "Direction",
    ownerLabel: "Owner",
  };
}

function getStatusLabel(status: string, dictionary: Dictionary) {
  switch (status as ProjectStatus | "unknown") {
    case "planning":
      return dictionary.projectPage.planning;
    case "in_progress":
      return dictionary.projectPage.inProgress;
    case "completed":
      return dictionary.projectPage.completed;
    case "on_hold":
      return dictionary.projectPage.onHold;
    default:
      return dictionary.dashboard.unknownStatus;
  }
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <article className="rounded-[1.75rem] border app-border bg-[color:var(--surface)] p-5">
      <div className={`h-1.5 w-16 rounded-full ${accent}`} />
      <p className="mt-4 text-sm font-medium app-soft">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 app-muted">{hint}</p>
    </article>
  );
}

function GaugeCard({
  label,
  value,
  suffix,
  color,
  hint,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
  hint: string;
}) {
  const progress = Math.max(0, Math.min(value, 100));
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section className="rounded-[2rem] app-card p-6">
      <div className="flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-[color:var(--surface-muted)]"
            />
            <circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={color}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-semibold text-[color:var(--foreground)]">
              {value}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] app-soft">{suffix}</span>
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-[color:var(--foreground)]">{label}</p>
          <p className="mt-2 text-sm leading-6 app-muted">{hint}</p>
        </div>
      </div>
    </section>
  );
}

function DistributionChart({
  title,
  items,
  locale,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  locale: Locale;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-[2rem] app-card p-6">
      <h2 className="text-xl font-semibold text-[color:var(--foreground)]">{title}</h2>

      <div className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--foreground)]">{item.label}</p>
                <p className="text-sm app-soft">{formatCompactNumber(item.value, locale)}</p>
              </div>
              <div className="h-3 rounded-full bg-[color:var(--surface-muted)]">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,_#0f172a,_#f59e0b)]"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm app-muted">0</p>
        )}
      </div>
    </section>
  );
}

function ActivityChart({
  items,
  dictionary,
  locale,
}: {
  items: DashboardStats["monthlyActivity"];
  dictionary: Dictionary;
  locale: Locale;
}) {
  const maxValue = Math.max(
    ...items.flatMap((item) => [item.profiles, item.projects, item.votes]),
    1,
  );

  const series = [
    {
      key: "profiles",
      label: dictionary.dashboard.creatorsJoined,
      color: "bg-sky-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.profiles,
    },
    {
      key: "projects",
      label: dictionary.dashboard.projectsPublished,
      color: "bg-emerald-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.projects,
    },
    {
      key: "votes",
      label: dictionary.dashboard.votesCast,
      color: "bg-rose-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.votes,
    },
  ];

  return (
    <section className="rounded-[2rem] app-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] app-soft">
            {dictionary.dashboard.analyticsEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
            {dictionary.dashboard.growthLastMonths}
          </h2>
        </div>
        <p className="text-sm app-muted">{dictionary.dashboard.updatedDaily}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.9fr)]">
        <div className="rounded-[1.75rem] bg-[color:var(--surface)] p-4">
          <div className="flex h-72 items-end gap-3">
            {items.map((item) => (
              <div key={item.key} className="flex min-w-0 flex-1 items-end gap-1">
                {series.map((entry) => {
                  const value = entry.value(item);
                  const height = `${Math.max((value / maxValue) * 100, value > 0 ? 10 : 0)}%`;

                  return (
                    <div key={`${item.key}-${entry.key}`} className="flex-1">
                      <div
                        className={`w-full rounded-t-2xl ${entry.color}`}
                        style={{ height }}
                        title={`${entry.label}: ${value}`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-6 gap-3">
            {items.map((item) => (
              <div key={item.key} className="text-center text-xs app-soft">
                {formatMonthLabel(item.key, locale)}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border app-border bg-[color:var(--surface)] p-4">
          <div className="space-y-3">
            {series.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${entry.color}`} />
                  <span className="text-sm text-[color:var(--foreground)]">{entry.label}</span>
                </div>
                <span className="text-sm app-soft">
                  {formatCompactNumber(
                    items.reduce((sum, item) => sum + entry.value(item), 0),
                    locale,
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] app-panel p-4">
            <p className="text-sm font-medium text-[color:var(--foreground)]">
              {dictionary.dashboard.totalTrafficPulse}
            </p>
            <p className="mt-2 text-sm leading-6 app-muted">
              {dictionary.dashboard.totalTrafficDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompletionBands({
  items,
  locale,
  ui,
}: {
  items: DashboardStats["completionBreakdown"];
  locale: Locale;
  ui: ReturnType<typeof getDashboardUi>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  const labels = {
    starter: ui.starter,
    growing: ui.growing,
    complete: ui.complete,
  } as const;

  const colors = {
    starter: "bg-slate-400",
    growing: "bg-amber-500",
    complete: "bg-emerald-500",
  } as const;

  return (
    <section className="rounded-[2rem] app-card p-6">
      <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
        {ui.profileReadiness}
      </h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${colors[item.key]}`} />
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  {labels[item.key]}
                </span>
              </div>
              <span className="text-sm app-soft">
                {formatCompactNumber(item.value, locale)}
              </span>
            </div>

            <div className="h-3 rounded-full bg-[color:var(--surface-muted)]">
              <div
                className={`h-3 rounded-full ${colors[item.key]}`}
                style={{ width: `${(item.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardAnalytics({
  dictionary,
  locale,
  stats,
  isAdmin,
}: {
  dictionary: Dictionary;
  locale: Locale;
  stats: DashboardStats;
  isAdmin: boolean;
}) {
  const ui = getDashboardUi(locale);
  const moderationCopy = getModerationCopy(locale);
  const publicProfilesRate =
    stats.siteTotals.profiles > 0
      ? Math.round((stats.siteTotals.publicProfiles / stats.siteTotals.profiles) * 100)
      : 0;
  const strongestScore = Math.max(...stats.topProjects.map((project) => project.score), 1);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] border app-border bg-[linear-gradient(145deg,_rgba(15,23,42,0.98),_rgba(3,105,161,0.94)_48%,_rgba(245,158,11,0.86))] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              {ui.heroEyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight">
              {ui.heroTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/80">
              {ui.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/profile/edit" size="lg">
                {ui.openProfile}
              </ButtonLink>
              <ButtonLink href="/projects/new" variant="secondary" size="lg">
                {ui.manageProjects}
              </ButtonLink>
              <ButtonLink href="/talents" variant="ghost" size="lg">
                {ui.openSearch}
              </ButtonLink>
              {isAdmin && (
                <ButtonLink href="/dashboard/moderation" variant="ghost" size="lg">
                  {moderationCopy.dashboard.openQueue}
                </ButtonLink>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label={dictionary.dashboard.creators}
              value={formatCompactNumber(stats.siteTotals.profiles, locale)}
              accent="bg-sky-400"
              hint={`${formatCompactNumber(stats.siteTotals.publicProfiles, locale)} ${ui.publicProfiles.toLowerCase()}`}
            />
            <MetricCard
              label={dictionary.dashboard.projects}
              value={formatCompactNumber(stats.siteTotals.projects, locale)}
              accent="bg-emerald-400"
              hint={dictionary.dashboard.siteProjectsHint}
            />
            <MetricCard
              label={ui.creatorCountries}
              value={formatCompactNumber(stats.siteTotals.countries, locale)}
              accent="bg-amber-400"
              hint={ui.creatorOrigins}
            />
            <MetricCard
              label={ui.creatorDirections}
              value={formatCompactNumber(stats.siteTotals.categories, locale)}
              accent="bg-rose-400"
              hint={ui.creatorDirectionsMix}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={ui.publicProfiles}
          value={formatCompactNumber(stats.siteTotals.publicProfiles, locale)}
          accent="bg-cyan-500"
          hint={`${publicProfilesRate}%`}
        />
        <MetricCard
          label={dictionary.dashboard.communityVotes}
          value={formatCompactNumber(stats.siteTotals.votes, locale)}
          accent="bg-rose-500"
          hint={`${formatCompactNumber(stats.siteTotals.likes, locale)} ${dictionary.projectPage.likes} / ${formatCompactNumber(stats.siteTotals.dislikes, locale)} ${dictionary.projectPage.dislikes}`}
        />
        <MetricCard
          label={ui.avgProjectScore}
          value={formatCompactNumber(stats.siteTotals.avgProjectScore, locale)}
          accent="bg-emerald-500"
          hint={dictionary.dashboard.audienceResponse}
        />
        <MetricCard
          label={ui.avgProfileCompletion}
          value={`${stats.siteTotals.avgProfileCompletion}%`}
          accent="bg-slate-500"
          hint={ui.profileReadiness}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <GaugeCard
          label={ui.avgProfileCompletion}
          value={stats.siteTotals.avgProfileCompletion}
          suffix="%"
          color="text-emerald-500"
          hint={ui.profileReadiness}
        />

        <GaugeCard
          label={ui.publicProfiles}
          value={publicProfilesRate}
          suffix="%"
          color="text-sky-500"
          hint={dictionary.dashboard.publicProfilesHint.replace(
            "{count}",
            formatCompactNumber(stats.siteTotals.publicProfiles, locale),
          )}
        />
      </section>

      <ActivityChart items={stats.monthlyActivity} dictionary={dictionary} locale={locale} />

      <section className="grid gap-6 xl:grid-cols-2">
        <DistributionChart
          title={ui.creatorOrigins}
          locale={locale}
          items={stats.countryBreakdown}
        />

        <DistributionChart
          title={ui.creatorDirectionsMix}
          locale={locale}
          items={stats.categoryBreakdown}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CompletionBands items={stats.completionBreakdown} locale={locale} ui={ui} />

        <section className="rounded-[2rem] app-card p-6">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
            {ui.skillsUniverse}
          </h2>
          <p className="mt-2 text-sm leading-6 app-muted">{ui.skillsDescription}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {stats.topSkills.length > 0 ? (
              stats.topSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-full border app-border bg-[color:var(--surface)] px-4 py-2"
                >
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    {skill.name}
                  </span>
                  <span className="ml-2 text-sm app-soft">{skill.value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm app-muted">{dictionary.dashboard.noProjectsYet}</p>
            )}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] app-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] app-soft">
              {dictionary.dashboard.audienceResponse}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
              {ui.topProjectsTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 app-muted">{ui.topProjectsDescription}</p>
          </div>
          <ButtonLink href="/projects" variant="secondary" size="sm">
            {dictionary.home.viewAllProjects}
          </ButtonLink>
        </div>

        <div className="mt-6 grid gap-4">
          {stats.topProjects.length > 0 ? (
            stats.topProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-[1.5rem] border app-border bg-[color:var(--surface)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-[color:var(--foreground)]">
                      {project.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm app-muted">
                      {project.ownerName && (
                        <span className="rounded-full app-panel px-3 py-1">
                          {ui.ownerLabel}: {project.ownerName}
                        </span>
                      )}
                      {project.categoryName && (
                        <span className="rounded-full app-panel px-3 py-1">
                          {ui.directionLabel}: {project.categoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  <ButtonLink
                    href={buildProjectPath(project.id, project.slug)}
                    variant="ghost"
                    size="sm"
                  >
                    {dictionary.common.viewProject}
                  </ButtonLink>
                </div>

                <div className="mt-5 h-3 rounded-full bg-[color:var(--surface-muted)]">
                  <div
                    className="h-3 rounded-full bg-[linear-gradient(90deg,_#0f172a,_#10b981)]"
                    style={{
                      width: `${Math.max((project.score / strongestScore) * 100, project.score > 0 ? 8 : 0)}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm app-soft">
                  <span>
                    {dictionary.dashboard.totalScore}: {project.score}
                  </span>
                  <span>
                    {project.likes} {dictionary.projectPage.likes}
                  </span>
                  <span>
                    {project.dislikes} {dictionary.projectPage.dislikes}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.5rem] app-panel-dashed p-6 text-sm app-muted">
              {dictionary.dashboard.noProjectsYet}
            </div>
          )}
        </div>
      </section>

      <DistributionChart
        title={dictionary.dashboard.projectStatusMix}
        locale={locale}
        items={stats.statusBreakdown.map((item) => ({
          label: getStatusLabel(item.key, dictionary),
          value: item.value,
        }))}
      />
    </div>
  );
}
