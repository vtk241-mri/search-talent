import { ButtonLink } from "@/components/ui/Button";
import type { DashboardStats, UserDashboardStats } from "@/lib/db/dashboard";
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

function getDashboardUi(locale: Locale) {
  if (locale === "uk") {
    return {
      publicProfiles: "Публічні профілі",
      creatorDirections: "Напрямки",
      creatorCountries: "Країни",
      creatorOrigins: "Географія фахівців",
      creatorDirectionsMix: "Розподіл за напрямками",
      profileReadiness: "Якість профілів",
      skillsUniverse: "Карта скілів платформи",
      skillsDescription:
        "Навички з профілів і технології з проєктів разом — реальний стек платформи.",
      starter: "Початковий",
      growing: "Розвивається",
      complete: "Сильний",
      topProjectsTitle: "Найсильніші проєкти",
      directionLabel: "Напрямок",
      ownerLabel: "Автор",
      likesLabel: "Лайки",
      dislikesLabel: "Дизлайки",
      editProfile: "Редагувати профіль",
      manageProjects: "Керувати проєктами",
      openSearch: "Пошук",
      savedItems: "Збережене",
      followingAuthors: "Підписки",
      writeArticle: "Написати статтю",
    };
  }

  return {
    publicProfiles: "Public profiles",
    creatorDirections: "Directions",
    creatorCountries: "Countries",
    creatorOrigins: "Talent geography",
    creatorDirectionsMix: "Direction distribution",
    profileReadiness: "Profile readiness",
    skillsUniverse: "Platform skill map",
    skillsDescription:
      "Profile skills and project technologies combined — the actual platform stack.",
    starter: "Starter",
    growing: "Growing",
    complete: "Strong",
    topProjectsTitle: "Top projects",
    directionLabel: "Direction",
    ownerLabel: "Owner",
    likesLabel: "Likes",
    dislikesLabel: "Dislikes",
    editProfile: "Edit profile",
    manageProjects: "Manage projects",
    openSearch: "Search",
    savedItems: "Saved",
    followingAuthors: "Following",
    writeArticle: "Write article",
  };
}

/* ─── Small reusable pieces ─── */

function StatNumber({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider app-soft">{label}</span>
    </div>
  );
}

function PersonalStatCard({
  value,
  label,
  href,
  accent,
}: {
  value: string;
  label: string;
  href: string;
  accent: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border app-border bg-[color:var(--surface)] p-5 transition-shadow hover:shadow-md"
    >
      <div className={`mb-3 h-1 w-10 rounded-full ${accent}`} />
      <p className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">{value}</p>
      <p className="mt-1 text-sm font-medium app-soft group-hover:text-[color:var(--foreground)] transition-colors">
        {label}
      </p>
    </a>
  );
}

function PlatformMetricCard({
  value,
  label,
  hint,
  accent,
}: {
  value: string;
  label: string;
  hint?: string;
  accent: string;
}) {
  return (
    <article className="rounded-2xl border app-border bg-[color:var(--surface)] p-5">
      <div className={`mb-3 h-1 w-10 rounded-full ${accent}`} />
      <p className="text-sm font-medium app-soft">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs app-muted">{hint}</p>}
    </article>
  );
}

/* ─── Activity chart ─── */

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
      dot: "bg-sky-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.profiles,
    },
    {
      key: "projects",
      label: dictionary.dashboard.projectsPublished,
      color: "bg-emerald-500",
      dot: "bg-emerald-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.projects,
    },
    {
      key: "votes",
      label: dictionary.dashboard.votesCast,
      color: "bg-amber-500",
      dot: "bg-amber-500",
      value: (item: DashboardStats["monthlyActivity"][number]) => item.votes,
    },
  ];

  return (
    <section className="rounded-2xl app-card p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {dictionary.dashboard.growthLastMonths}
        </h2>
        <div className="flex flex-wrap gap-4">
          {series.map((entry) => (
            <div key={entry.key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${entry.dot}`} />
              <span className="text-xs font-medium app-soft">{entry.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex min-w-0 flex-1 flex-col items-stretch gap-1">
            <div className="flex flex-1 items-end gap-0.5 sm:gap-1">
              {series.map((entry) => {
                const v = entry.value(item);
                const height = `${Math.max((v / maxValue) * 100, v > 0 ? 8 : 0)}%`;
                return (
                  <div key={`${item.key}-${entry.key}`} className="flex-1">
                    <div
                      className={`w-full rounded-t-lg ${entry.color} transition-all`}
                      style={{ height }}
                      title={`${entry.label}: ${v}`}
                    />
                  </div>
                );
              })}
            </div>
            <span className="mt-2 text-center text-xs app-soft">
              {formatMonthLabel(item.key, locale)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Horizontal bar distribution ─── */

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
    <section className="rounded-2xl app-card p-6">
      <h2 className="mb-5 text-lg font-semibold text-[color:var(--foreground)]">{title}</h2>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--foreground)]">{item.label}</p>
                <p className="text-sm tabular-nums app-soft">
                  {formatCompactNumber(item.value, locale)}
                </p>
              </div>
              <div className="h-2 rounded-full bg-[color:var(--surface-muted)]">
                <div
                  className="h-2 rounded-full bg-[color:var(--foreground)] opacity-70"
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

/* ─── Completion bands ─── */

function CompletionBands({
  items,
  total,
  locale,
  ui,
}: {
  items: DashboardStats["completionBreakdown"];
  total: number;
  locale: Locale;
  ui: ReturnType<typeof getDashboardUi>;
}) {
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

  const dots = {
    starter: "bg-slate-400",
    growing: "bg-amber-500",
    complete: "bg-emerald-500",
  } as const;

  return (
    <section className="rounded-2xl app-card p-6">
      <h2 className="mb-5 text-lg font-semibold text-[color:var(--foreground)]">
        {ui.profileReadiness}
      </h2>

      {/* stacked bar */}
      <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
        {items.map((item) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={item.key}
              className={`${colors[item.key]}`}
              style={{ width: `${pct}%` }}
              title={`${labels[item.key]}: ${item.value}`}
            />
          );
        })}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dots[item.key]}`} />
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  {labels[item.key]}
                </span>
              </div>
              <span className="text-sm tabular-nums app-soft">
                {formatCompactNumber(item.value, locale)} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Skills cloud ─── */

function SkillCloud({
  skills,
  ui,
  dictionary,
}: {
  skills: DashboardStats["topSkills"];
  ui: ReturnType<typeof getDashboardUi>;
  dictionary: Dictionary;
}) {
  if (skills.length === 0) {
    return (
      <section className="rounded-2xl app-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-[color:var(--foreground)]">
          {ui.skillsUniverse}
        </h2>
        <p className="text-sm app-muted">{dictionary.dashboard.noProjectsYet}</p>
      </section>
    );
  }

  const maxCount = Math.max(...skills.map((s) => s.value), 1);

  return (
    <section className="rounded-2xl app-card p-6">
      <h2 className="mb-2 text-lg font-semibold text-[color:var(--foreground)]">
        {ui.skillsUniverse}
      </h2>
      <p className="mb-5 text-xs app-muted">{ui.skillsDescription}</p>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const intensity = Math.max(0.35, skill.value / maxCount);
          return (
            <span
              key={skill.name}
              className="inline-flex items-center gap-1.5 rounded-full border app-border bg-[color:var(--surface)] px-3 py-1.5 text-sm"
              style={{ opacity: 0.5 + intensity * 0.5 }}
            >
              <span className="font-medium text-[color:var(--foreground)]">{skill.name}</span>
              <span className="text-xs tabular-nums app-soft">{skill.value}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Top projects ─── */

function TopProjects({
  projects,
  dictionary,
  locale,
  ui,
}: {
  projects: DashboardStats["topProjects"];
  dictionary: Dictionary;
  locale: Locale;
  ui: ReturnType<typeof getDashboardUi>;
}) {
  if (projects.length === 0) {
    return (
      <section className="rounded-2xl app-card p-6">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {ui.topProjectsTitle}
        </h2>
        <p className="mt-3 text-sm app-muted">{dictionary.dashboard.noProjectsYet}</p>
      </section>
    );
  }

  const strongestScore = Math.max(...projects.map((p) => p.score), 1);

  return (
    <section className="rounded-2xl app-card p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
          {ui.topProjectsTitle}
        </h2>
        <ButtonLink href="/projects" variant="ghost" size="sm">
          {dictionary.home.viewAllProjects}
        </ButtonLink>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <a
            key={project.id}
            href={buildProjectPath(project.id, project.slug)}
            className="group block rounded-xl border app-border bg-[color:var(--surface)] p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[color:var(--foreground)] group-hover:underline">
                  {project.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs app-muted">
                  {project.ownerName && (
                    <span>{ui.ownerLabel}: {project.ownerName}</span>
                  )}
                  {project.categoryName && (
                    <span>{ui.directionLabel}: {project.categoryName}</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums app-soft">
                <span>{project.likes} {ui.likesLabel}</span>
                <span>{project.dislikes} {ui.dislikesLabel}</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {dictionary.dashboard.totalScore}: {project.score}
                </span>
              </div>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-[color:var(--surface-muted)]">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.max((project.score / strongestScore) * 100, project.score > 0 ? 6 : 0)}%`,
                }}
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─── Donut / ring chart ─── */

function DonutChart({
  title,
  items,
  dictionary,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  dictionary: Dictionary;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <section className="rounded-2xl app-card p-6">
        <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h2>
        <p className="mt-3 text-sm app-muted">{dictionary.dashboard.noData}</p>
      </section>
    );
  }

  const colors = [
    "text-sky-500",
    "text-emerald-500",
    "text-amber-500",
    "text-rose-500",
    "text-violet-500",
    "text-cyan-500",
    "text-orange-500",
    "text-teal-500",
  ];

  const dotColors = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <section className="rounded-2xl app-card p-6">
      <h2 className="mb-5 text-lg font-semibold text-[color:var(--foreground)]">{title}</h2>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {items.map((item, index) => {
              const pct = item.value / total;
              const dash = pct * circumference;
              const offset = cumulativeOffset;
              cumulativeOffset += dash;

              return (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  className={colors[index % colors.length]}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-[color:var(--foreground)]">{total}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {items.map((item, index) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColors[index % dotColors.length]}`} />
                  <span className="text-sm text-[color:var(--foreground)]">{item.label}</span>
                </div>
                <span className="text-sm tabular-nums app-soft">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Main component ─── */

export default function DashboardAnalytics({
  dictionary,
  locale,
  stats,
  userStats,
  isAdmin,
}: {
  dictionary: Dictionary;
  locale: Locale;
  stats: DashboardStats;
  userStats: UserDashboardStats;
  isAdmin: boolean;
}) {
  const ui = getDashboardUi(locale);
  const moderationCopy = getModerationCopy(locale);
  const publicProfilesRate =
    stats.siteTotals.profiles > 0
      ? Math.round((stats.siteTotals.publicProfiles / stats.siteTotals.profiles) * 100)
      : 0;
  const completionTotal = stats.completionBreakdown.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-6">
      {/* ─── Quick actions ─── */}
      <nav className="flex flex-wrap gap-2">
        <ButtonLink href="/profile/edit" size="sm">
          {ui.editProfile}
        </ButtonLink>
        <ButtonLink href="/dashboard/projects" variant="secondary" size="sm">
          {ui.manageProjects}
        </ButtonLink>
        <ButtonLink href="/articles/new" variant="secondary" size="sm">
          {ui.writeArticle}
        </ButtonLink>
        <ButtonLink href="/talents" variant="ghost" size="sm">
          {ui.openSearch}
        </ButtonLink>
        <ButtonLink href="/dashboard/saved" variant="ghost" size="sm">
          {ui.savedItems}
        </ButtonLink>
        <ButtonLink href="/dashboard/following" variant="ghost" size="sm">
          {ui.followingAuthors}
        </ButtonLink>
        {isAdmin && (
          <ButtonLink href="/dashboard/moderation" variant="ghost" size="sm">
            {moderationCopy.dashboard.openQueue}
          </ButtonLink>
        )}
      </nav>

      {/* ─── Personal stats ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest app-soft">
          {dictionary.dashboard.myStats}
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <PersonalStatCard
            value={String(userStats.projectsCount)}
            label={dictionary.dashboard.myProjects}
            href={`/${locale}/dashboard/projects`}
            accent="bg-emerald-500"
          />
          <PersonalStatCard
            value={String(userStats.articlesCount)}
            label={dictionary.dashboard.myArticles}
            href={`/${locale}/articles`}
            accent="bg-violet-500"
          />
          <PersonalStatCard
            value={String(userStats.followersCount)}
            label={dictionary.dashboard.followers}
            href={`/${locale}/dashboard/following`}
            accent="bg-sky-500"
          />
          <PersonalStatCard
            value={String(userStats.followingCount)}
            label={dictionary.dashboard.following}
            href={`/${locale}/dashboard/following`}
            accent="bg-cyan-500"
          />
          <PersonalStatCard
            value={String(userStats.bookmarksCount)}
            label={dictionary.dashboard.bookmarks}
            href={`/${locale}/dashboard/saved`}
            accent="bg-amber-500"
          />
          <PersonalStatCard
            value={String(userStats.receivedLikes)}
            label={dictionary.dashboard.receivedLikes}
            href={`/${locale}/dashboard/projects`}
            accent="bg-rose-500"
          />
        </div>
      </section>

      {/* ─── Platform overview ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest app-soft">
          {dictionary.dashboard.platformOverview}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformMetricCard
            label={dictionary.dashboard.totalCreators}
            value={formatCompactNumber(stats.siteTotals.profiles, locale)}
            accent="bg-sky-500"
            hint={`${formatCompactNumber(stats.siteTotals.publicProfiles, locale)} ${ui.publicProfiles.toLowerCase()} (${publicProfilesRate}%)`}
          />
          <PlatformMetricCard
            label={dictionary.dashboard.totalProjects}
            value={formatCompactNumber(stats.siteTotals.projects, locale)}
            accent="bg-emerald-500"
            hint={dictionary.dashboard.siteProjectsHint}
          />
          <PlatformMetricCard
            label={dictionary.dashboard.totalVotes}
            value={formatCompactNumber(stats.siteTotals.votes, locale)}
            accent="bg-amber-500"
            hint={`${formatCompactNumber(stats.siteTotals.likes, locale)} ${ui.likesLabel.toLowerCase()} / ${formatCompactNumber(stats.siteTotals.dislikes, locale)} ${ui.dislikesLabel.toLowerCase()}`}
          />
          <PlatformMetricCard
            label={dictionary.dashboard.profileCompletion}
            value={`${stats.siteTotals.avgProfileCompletion}%`}
            accent="bg-slate-500"
            hint={ui.profileReadiness}
          />
        </div>
      </section>

      {/* ─── Activity chart ─── */}
      <ActivityChart items={stats.monthlyActivity} dictionary={dictionary} locale={locale} />

      {/* ─── Distributions: geography & directions ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      {/* ─── Profile quality & skills ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CompletionBands
          items={stats.completionBreakdown}
          total={completionTotal}
          locale={locale}
          ui={ui}
        />
        <SkillCloud skills={stats.topSkills} ui={ui} dictionary={dictionary} />
      </div>

      {/* ─── Top projects ─── */}
      <TopProjects
        projects={stats.topProjects}
        dictionary={dictionary}
        locale={locale}
        ui={ui}
      />

      {/* ─── Project status donut ─── */}
      <DonutChart
        title={dictionary.dashboard.projectStatusMix}
        dictionary={dictionary}
        items={stats.statusBreakdown.map((item) => ({
          label: getStatusLabel(item.key, dictionary),
          value: item.value,
        }))}
      />
    </div>
  );
}
