"use client";

import { useEffect, useMemo, useState } from "react";
import CreatorCard from "@/components/creator-card";
import ProjectCard from "@/components/project-card";
import { ButtonLink } from "@/components/ui/Button";
import LocalizedLink from "@/components/ui/localized-link";
import SearchSelect from "@/components/ui/search-select";
import TagSelect from "@/components/ui/tag-select";
import { useCurrentLocale, useDictionary } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { ProfileCategory } from "@/lib/profile-categories";
import {
  employmentTypes,
  experienceLevels,
  workFormats,
  type EmploymentType,
  type ExperienceLevel,
  type WorkFormat,
} from "@/lib/profile-sections";
import { projectStatuses, type ProjectStatus } from "@/lib/projects";

export type DiscoveryMode = "projects" | "creators";

type MetaOption = {
  id: number;
  name: string;
};

type SearchProject = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  score: number | null;
  cover_url: string | null;
  project_status: string | null;
  ownerName: string | null;
  ownerUsername: string | null;
  technologies: Array<{ id: number; name: string }>;
  mediaCount: number;
};

type SearchUser = {
  id: string;
  username: string;
  name: string | null;
  headline: string | null;
  avatar_url: string | null;
  countryName: string | null;
  city: string | null;
  categoryName: string | null;
  technologies: Array<{ id: number; name: string }>;
};

type SearchResponse = {
  projects: SearchProject[];
  users: SearchUser[];
  totals: {
    projects: number;
    users: number;
  };
};

type Sort = "relevance" | "rating" | "newest";

type DiscoveryPageProps = {
  mode: DiscoveryMode;
};

type DiscoveryCopy = {
  common: {
    filters: string;
    resetFilters: string;
    sortBy: string;
    sortRelevance: string;
    sortRating: string;
    sortNewest: string;
    filterCountry: string;
    anyCountry: string;
    filterSkills: string;
    anySkill: string;
    filterCategory: string;
    anyCategory: string;
    filterProjectStatus: string;
    anyStatus: string;
    onlyWithMedia: string;
    resultsSummary: string;
    activeFilters: string;
    queryLabel: string;
    mediaCount: string;
    loading: string;
    searchFailed: string;
    projectsMatched: string;
    creatorsMatched: string;
  };
  modes: Record<
    DiscoveryMode,
    {
      eyebrow: string;
      title: string;
      description: string;
      placeholder: string;
      secondaryHref: string;
      secondaryLabel: string;
      summaryDescription: string;
      resultsDescription: string;
      emptyMessage: string;
      heroCards: Array<{
        title: string;
        description: string;
      }>;
    }
  >;
};

function getStatusLabel(
  status: string | null,
  dictionary: ReturnType<typeof useDictionary>,
  anyStatusLabel: string,
) {
  switch (status as ProjectStatus | null) {
    case "planning":
      return dictionary.forms.projectStatusPlanning;
    case "in_progress":
      return dictionary.forms.projectStatusInProgress;
    case "completed":
      return dictionary.forms.projectStatusCompleted;
    case "on_hold":
      return dictionary.forms.projectStatusOnHold;
    default:
      return anyStatusLabel;
  }
}

function DiscoveryModeLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <LocalizedLink
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white text-slate-950"
          : "border border-white/15 bg-white/10 text-white/82 hover:bg-white/16 hover:text-white",
      ].join(" ")}
    >
      {label}
    </LocalizedLink>
  );
}

function getEmploymentTypeLabel(
  value: EmploymentType,
  dictionary: ReturnType<typeof useDictionary>,
) {
  switch (value) {
    case "full_time":
      return dictionary.forms.employmentTypeFullTime;
    case "part_time":
      return dictionary.forms.employmentTypePartTime;
    case "contract":
      return dictionary.forms.employmentTypeContract;
    case "freelance":
      return dictionary.forms.employmentTypeFreelance;
    case "internship":
      return dictionary.forms.employmentTypeInternship;
    default:
      return value;
  }
}

function getWorkFormatLabel(
  value: WorkFormat,
  dictionary: ReturnType<typeof useDictionary>,
) {
  switch (value) {
    case "remote":
      return dictionary.forms.workFormatRemote;
    case "hybrid":
      return dictionary.forms.workFormatHybrid;
    case "office":
      return dictionary.forms.workFormatOffice;
    default:
      return value;
  }
}

function getExperienceLevelLabel(value: ExperienceLevel, locale: Locale) {
  if (locale === "uk") {
    const labels: Record<ExperienceLevel, string> = {
      no_experience: "Без досвіду",
      months_3: "3 міс",
      months_6: "6 міс",
      year_1: "1 рік",
      years_2: "2 роки",
      years_3: "3 роки",
      years_4: "4 роки",
      years_5: "5 років",
      years_6: "6 років",
      years_7: "7 років",
      years_8: "8 років",
      years_9: "9 років",
      years_10: "10 років",
      more_than_10_years: "> 10 років",
    };

    return labels[value];
  }

  const labels: Record<ExperienceLevel, string> = {
    no_experience: "No experience",
    months_3: "3 months",
    months_6: "6 months",
    year_1: "1 year",
    years_2: "2 years",
    years_3: "3 years",
    years_4: "4 years",
    years_5: "5 years",
    years_6: "6 years",
    years_7: "7 years",
    years_8: "8 years",
    years_9: "9 years",
    years_10: "10 years",
    more_than_10_years: "10+ years",
  };

  return labels[value];
}

function getDiscoveryCopy(locale: Locale): DiscoveryCopy {
  if (locale === "uk") {
    return {
      common: {
        filters: "Фільтри",
        resetFilters: "Скинути",
        sortBy: "Сортування",
        sortRelevance: "За релевантністю",
        sortRating: "За рейтингом",
        sortNewest: "Найновіші",
        filterCountry: "Країна",
        anyCountry: "Будь-яка країна",
        filterSkills: "Навички",
        anySkill: "Будь-яка навичка",
        filterCategory: "Напрямок",
        anyCategory: "Будь-який напрямок",
        filterProjectStatus: "Статус проєкту",
        anyStatus: "Будь-який статус",
        onlyWithMedia: "Лише з медіа",
        resultsSummary: "Зведення пошуку",
        activeFilters: "Активні фільтри",
        queryLabel: "Запит",
        mediaCount: "Медіа",
        loading: "Оновлення результатів...",
        searchFailed: "Зараз не вдалося завантажити результати пошуку.",
        projectsMatched: "Знайдено проєктів",
        creatorsMatched: "Знайдено талантів",
      },
      modes: {
        projects: {
          eyebrow: "Пошук проєктів",
          title: "Знайдіть потрібні проєкти в каталозі",
          description:
            "Тут зібрані лише проєкти, тож можна шукати за стеком, статусом, темою та матеріалами без зайвого шуму.",
          placeholder: "Шукайте проєкти, технології або авторів...",
          secondaryHref: "/talents",
          secondaryLabel: "Шукати таланти",
          summaryDescription:
            "Звужуйте список за стеком, статусом і наявністю медіа, щоб швидше знаходити потрібні роботи.",
          resultsDescription:
            "Тут відображаються лише публічні проєкти, тому шукати й переглядати каталог однаково просто.",
          emptyMessage:
            "Нічого не знайшлося. Спробуйте інший запит або послабте фільтри.",
          heroCards: [
            {
              title: "Пошук за назвою або стеком",
              description:
                "Шукайте за назвою, описом або технологіями, щоб швидко знаходити релевантні роботи.",
            },
            {
              title: "Фільтр за статусом і медіа",
              description:
                "Залишайте у видачі проєкти з потрібним статусом і достатньою кількістю матеріалів.",
            },
            {
              title: "Перехід до автора",
              description:
                "Якщо проєкт зацікавив, одразу переходьте до профілю автора.",
            },
          ],
        },
        creators: {
          eyebrow: "Пошук талантів",
          title: "Знайдіть потрібних фахівців без шуму від проєктів",
          description:
            "На цій сторінці лише профілі, тож можна спокійно відбирати людей за навичками, локацією, досвідом і форматом роботи.",
          placeholder: "Шукайте таланти, ролі або навички...",
          secondaryHref: "/projects",
          secondaryLabel: "Шукати проєкти",
          summaryDescription:
            "Комбінуйте фільтри профілю, щоб швидко зібрати короткий список релевантних людей.",
          resultsDescription:
            "Тут відображаються лише профілі, тому ніщо не відволікає від пошуку людей.",
          emptyMessage:
            "Нічого не знайшлося. Спробуйте інший запит або зменшіть кількість фільтрів.",
          heroCards: [
            {
              title: "Пошук за роллю або навичками",
              description:
                "Вкажіть роль, спеціалізацію або ключову технологію й одразу звузьте видачу.",
            },
            {
              title: "Локація й напрямок",
              description:
                "Фільтруйте за країною, напрямком і форматом роботи, коли важливий контекст співпраці.",
            },
            {
              title: "Швидкий перехід у профіль",
              description:
                "Відкривайте профіль, щоб одразу оцінити навички, досвід і пов'язані проєкти.",
            },
          ],
        },
      },
    };
  }

  return {
    common: {
      filters: "Filters",
      resetFilters: "Reset",
      sortBy: "Sort by",
      sortRelevance: "Relevance",
      sortRating: "Rating",
      sortNewest: "Newest",
      filterCountry: "Country",
      anyCountry: "Any country",
      filterSkills: "Skills",
      anySkill: "Any skill",
      filterCategory: "Direction",
      anyCategory: "Any direction",
      filterProjectStatus: "Project status",
      anyStatus: "Any status",
      onlyWithMedia: "Only with media",
      resultsSummary: "Search summary",
      activeFilters: "Active filters",
      queryLabel: "Query",
      mediaCount: "Media",
      loading: "Refreshing results...",
      searchFailed: "Could not load search results right now.",
      projectsMatched: "Projects found",
      creatorsMatched: "Talents found",
    },
    modes: {
      projects: {
        eyebrow: "Project search",
        title: "Find the right projects faster",
        description:
          "This page is focused on projects only, so you can search by stack, status, topic, and media without mixing results with profiles.",
        placeholder: "Search projects, technologies, or authors...",
        secondaryHref: "/talents",
        secondaryLabel: "Search talents",
        summaryDescription:
          "Narrow the list by stack, status, and media so the right projects surface faster.",
        resultsDescription:
          "Only public projects appear here, so searching and browsing the catalog feel like one continuous flow.",
        emptyMessage:
          "No matching projects yet. Try another keyword or relax the filters.",
        heroCards: [
          {
            title: "Search by title or stack",
            description:
              "Search by title, description, or technology tags to find relevant work faster.",
          },
          {
            title: "Filter by status and media",
            description:
              "Keep projects with the right status and enough supporting media in view.",
          },
          {
            title: "Open creator context",
            description:
              "Jump from a project page to the author's profile whenever you need more context.",
          },
        ],
      },
      creators: {
        eyebrow: "Talent search",
        title: "Find the right talent without project noise",
        description:
          "This page is focused on people only, so filtering by skills, location, experience, and work format is much easier.",
        placeholder: "Search talents, roles, or skills...",
        secondaryHref: "/projects",
        secondaryLabel: "Search projects",
        summaryDescription:
          "Combine profile filters to build a strong shortlist faster.",
        resultsDescription:
          "Only profile cards appear here, so nothing distracts from finding the right people.",
        emptyMessage:
          "No matching talents yet. Try another keyword or reduce the filters.",
        heroCards: [
          {
            title: "Search by role or skill",
            description:
              "Type a role, specialty, or core technology and narrow the list quickly.",
          },
          {
            title: "Filter by location and direction",
            description:
              "Filter by country, category, and work format when collaboration context matters.",
          },
          {
            title: "Open the public profile",
            description:
              "Open a profile to review skills, experience, and linked projects in one place.",
          },
        ],
      },
    },
  };
}

export default function DiscoveryPage({ mode }: DiscoveryPageProps) {
  const dictionary = useDictionary();
  const locale = useCurrentLocale();
  const copy = useMemo(() => getDiscoveryCopy(locale), [locale]);
  const pageUi = copy.modes[mode];
  const commonUi = copy.common;
  const scope = mode;
  const [meta, setMeta] = useState<{
    countries: MetaOption[];
    languages: MetaOption[];
    skills: MetaOption[];
    categories: ProfileCategory[];
  }>({
    countries: [],
    languages: [],
    skills: [],
    categories: [],
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [languageIds, setLanguageIds] = useState<number[]>([]);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [employmentTypeFilters, setEmploymentTypeFilters] = useState<EmploymentType[]>([]);
  const [workFormatFilters, setWorkFormatFilters] = useState<WorkFormat[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | "">("");
  const [hasMedia, setHasMedia] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [totals, setTotals] = useState({
    projects: 0,
    users: 0,
  });

  useEffect(() => {
    async function loadMeta() {
      const response = await fetch("/api/meta");
      const payload = (await response.json()) as {
        countries?: MetaOption[];
        languages?: MetaOption[];
        skills?: MetaOption[];
        categories?: ProfileCategory[];
      };

      setMeta({
        countries: payload.countries || [],
        languages: payload.languages || [],
        skills: payload.skills || [],
        categories: payload.categories || [],
      });
    }

    loadMeta();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();

        if (query.trim()) {
          params.set("q", query.trim());
        }

        params.set("scope", scope);
        params.set("sort", sort);

        if (countryId && mode === "creators") {
          params.set("countryId", String(countryId));
        }

        if (categoryId && mode === "creators") {
          params.set("categoryId", String(categoryId));
        }

        if (skillIds.length > 0) {
          params.set("skillIds", skillIds.join(","));
        }

        if (languageIds.length > 0 && mode === "creators") {
          params.set("languageIds", languageIds.join(","));
        }

        if (experienceLevel && mode === "creators") {
          params.set("experienceLevel", experienceLevel);
        }

        if (employmentTypeFilters.length > 0 && mode === "creators") {
          params.set("employmentTypes", employmentTypeFilters.join(","));
        }

        if (workFormatFilters.length > 0 && mode === "creators") {
          params.set("workFormats", workFormatFilters.join(","));
        }

        if (projectStatus && mode === "projects") {
          params.set("projectStatus", projectStatus);
        }

        if (hasMedia && mode === "projects") {
          params.set("hasMedia", "1");
        }

        if (hasAvatar && mode === "creators") {
          params.set("hasAvatar", "1");
        }

        const response = await fetch(`/api/search?${params.toString()}`);
        const payload = (await response.json()) as SearchResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || commonUi.searchFailed);
        }

        setProjects(payload.projects || []);
        setUsers(payload.users || []);
        setTotals({
          projects: payload.totals?.projects || 0,
          users: payload.totals?.users || 0,
        });
      } catch {
        setProjects([]);
        setUsers([]);
        setTotals({ projects: 0, users: 0 });
        setErrorMessage(commonUi.searchFailed);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    categoryId,
    commonUi.searchFailed,
    countryId,
    employmentTypeFilters,
    experienceLevel,
    hasAvatar,
    hasMedia,
    languageIds,
    mode,
    projectStatus,
    query,
    scope,
    skillIds,
    sort,
    workFormatFilters,
  ]);

  const hasFilters =
    Boolean(query.trim()) ||
    Boolean(countryId) ||
    Boolean(categoryId) ||
    Boolean(experienceLevel) ||
    Boolean(projectStatus) ||
    hasAvatar ||
    hasMedia ||
    languageIds.length > 0 ||
    employmentTypeFilters.length > 0 ||
    skillIds.length > 0 ||
    workFormatFilters.length > 0 ||
    sort !== "relevance";
  const selectedCountryName =
    meta.countries.find((country) => country.id === countryId)?.name || null;
  const selectedCategoryLabel =
    meta.categories.find((option) => option.id === categoryId)?.name || null;
  const selectedLanguageNames = meta.languages
    .filter((language) => languageIds.includes(language.id))
    .map((language) => language.name);
  const selectedSkillNames = meta.skills
    .filter((skill) => skillIds.includes(skill.id))
    .map((skill) => skill.name);
  const avatarFilterLabel = locale === "uk" ? "Лише з фото" : "Only with photo";
  const anyExperienceLabel = locale === "uk" ? "Будь-який досвід" : "Any experience";
  const activeFilterLabels = [
    query.trim() ? `${commonUi.queryLabel}: ${query.trim()}` : null,
    sort !== "relevance"
      ? sort === "rating"
        ? commonUi.sortRating
        : commonUi.sortNewest
      : null,
    mode === "creators" && selectedCountryName
      ? `${commonUi.filterCountry}: ${selectedCountryName}`
      : null,
    mode === "creators" && selectedCategoryLabel
      ? `${commonUi.filterCategory}: ${selectedCategoryLabel}`
      : null,
    mode === "creators" && experienceLevel
      ? `${dictionary.forms.totalExperienceYears}: ${getExperienceLevelLabel(experienceLevel, locale)}`
      : null,
    mode === "projects" && projectStatus
      ? `${commonUi.filterProjectStatus}: ${getStatusLabel(projectStatus, dictionary, commonUi.anyStatus)}`
      : null,
    mode === "creators" && hasAvatar ? avatarFilterLabel : null,
    mode === "projects" && hasMedia ? commonUi.onlyWithMedia : null,
    ...selectedLanguageNames.map((language) => `${dictionary.forms.languages}: ${language}`),
    ...selectedSkillNames.map((skill) => `${commonUi.filterSkills}: ${skill}`),
    ...employmentTypeFilters.map(
      (item) =>
        `${dictionary.forms.employmentTypes}: ${getEmploymentTypeLabel(item, dictionary)}`,
    ),
    ...workFormatFilters.map(
      (item) =>
        `${dictionary.forms.workFormats}: ${getWorkFormatLabel(item, dictionary)}`,
    ),
  ].filter(Boolean) as string[];
  const talentsLabel = locale === "uk" ? "Таланти" : "Talents";
  const resultCount = mode === "projects" ? totals.projects : totals.users;
  const resultLabel =
    mode === "projects" ? commonUi.projectsMatched : commonUi.creatorsMatched;

  const resetFilters = () => {
    setQuery("");
    setSort("relevance");
    setCountryId(null);
    setCategoryId(null);
    setLanguageIds([]);
    setSkillIds([]);
    setExperienceLevel("");
    setEmploymentTypeFilters([]);
    setWorkFormatFilters([]);
    setProjectStatus("");
    setHasAvatar(false);
    setHasMedia(false);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.25rem] border app-border bg-[linear-gradient(145deg,_rgba(15,23,42,0.97),_rgba(30,64,175,0.9)_58%,_rgba(245,158,11,0.72))] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              {pageUi.eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {pageUi.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/78">
              {pageUi.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={pageUi.secondaryHref} variant="secondary">
              {pageUi.secondaryLabel}
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="ghost">
              {dictionary.search.dashboard}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-white/10 p-4 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <DiscoveryModeLink
              active={mode === "projects"}
              href="/projects"
              label={dictionary.common.projects}
            />
            <DiscoveryModeLink
              active={mode === "creators"}
              href="/talents"
              label={talentsLabel}
            />
          </div>

          <input
            type="text"
            placeholder={pageUi.placeholder}
            className="mt-4 w-full rounded-2xl border border-white/15 bg-white/90 px-4 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-slate-900"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {!hasFilters && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pageUi.heroCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur"
              >
                <p className="font-semibold text-white">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[2rem] app-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                {commonUi.filters}
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm app-muted transition hover:text-[color:var(--foreground)]"
              >
                {commonUi.resetFilters}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                  {commonUi.sortBy}
                </p>
                <select
                  className="w-full rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                >
                  <option value="relevance">{commonUi.sortRelevance}</option>
                  <option value="rating">{commonUi.sortRating}</option>
                  <option value="newest">{commonUi.sortNewest}</option>
                </select>
              </div>

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {commonUi.filterCountry}
                  </p>
                  <SearchSelect
                    options={meta.countries}
                    value={countryId ?? undefined}
                    placeholder={commonUi.anyCountry}
                    onChange={(value) => setCountryId(value)}
                  />
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                  {commonUi.filterSkills}
                </p>
                <TagSelect
                  options={meta.skills}
                  value={skillIds}
                  placeholder={commonUi.anySkill}
                  onChange={(values) => setSkillIds(values.map(Number))}
                />
              </div>

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {dictionary.forms.languages}
                  </p>
                  <TagSelect
                    options={meta.languages}
                    value={languageIds}
                    placeholder={dictionary.forms.searchLanguages}
                    onChange={(values) => setLanguageIds(values.map(Number))}
                  />
                </div>
              )}

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {commonUi.filterCategory}
                  </p>
                  <select
                    className="w-full rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                    value={categoryId ?? ""}
                    onChange={(event) =>
                      setCategoryId(event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">{commonUi.anyCategory}</option>
                    {meta.categories.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {dictionary.forms.totalExperienceYears}
                  </p>
                  <select
                    className="w-full rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                    value={experienceLevel}
                    onChange={(event) =>
                      setExperienceLevel(event.target.value as ExperienceLevel | "")
                    }
                  >
                    <option value="">{anyExperienceLabel}</option>
                    {experienceLevels.map((option) => (
                      <option key={option} value={option}>
                        {getExperienceLevelLabel(option, locale)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {dictionary.forms.employmentTypes}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {employmentTypes.map((option) => {
                      const selected = employmentTypeFilters.includes(option);

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setEmploymentTypeFilters((current) =>
                              selected
                                ? current.filter((item) => item !== option)
                                : [...current, option],
                            )
                          }
                          className={[
                            "rounded-full border px-3 py-2 text-sm transition-colors",
                            selected
                              ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
                              : "app-border bg-[color:var(--surface)] text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
                          ].join(" ")}
                        >
                          {getEmploymentTypeLabel(option, dictionary)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "creators" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                    {dictionary.forms.workFormats}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {workFormats.map((option) => {
                      const selected = workFormatFilters.includes(option);

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setWorkFormatFilters((current) =>
                              selected
                                ? current.filter((item) => item !== option)
                                : [...current, option],
                            )
                          }
                          className={[
                            "rounded-full border px-3 py-2 text-sm transition-colors",
                            selected
                              ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
                              : "app-border bg-[color:var(--surface)] text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
                          ].join(" ")}
                        >
                          {getWorkFormatLabel(option, dictionary)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "creators" && (
                <label className="flex items-center justify-between gap-3 rounded-2xl border app-border bg-[color:var(--surface)] px-4 py-3">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    {avatarFilterLabel}
                  </span>
                  <input
                    type="checkbox"
                    checked={hasAvatar}
                    onChange={(event) => setHasAvatar(event.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              )}

              {mode === "projects" && (
                <>
                  <div>
                    <p className="mb-2 text-sm font-medium text-[color:var(--foreground)]">
                      {commonUi.filterProjectStatus}
                    </p>
                    <select
                      className="w-full rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
                      value={projectStatus}
                      onChange={(event) =>
                        setProjectStatus(event.target.value as ProjectStatus | "")
                      }
                    >
                      <option value="">{commonUi.anyStatus}</option>
                      {projectStatuses.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status, dictionary, commonUi.anyStatus)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-2xl border app-border bg-[color:var(--surface)] px-4 py-3">
                    <span className="text-sm font-medium text-[color:var(--foreground)]">
                      {commonUi.onlyWithMedia}
                    </span>
                    <input
                      type="checkbox"
                      checked={hasMedia}
                      onChange={(event) => setHasMedia(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                </>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] app-card p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] app-soft">
              {commonUi.resultsSummary}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
              {resultCount}
            </p>
            <p className="mt-2 text-sm leading-6 app-muted">
              {loading ? commonUi.loading : pageUi.summaryDescription}
            </p>

            <div className="mt-5 rounded-[1.5rem] app-panel px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] app-soft">
                {resultLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                {resultCount}
              </p>
            </div>
          </section>
        </aside>

        <div className="space-y-8">
          {activeFilterLabels.length > 0 && (
            <section className="rounded-[2rem] app-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[color:var(--foreground)]">
                    {commonUi.activeFilters}
                  </h2>
                  <p className="mt-1 text-sm app-muted">
                    {pageUi.summaryDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm app-muted transition hover:text-[color:var(--foreground)]"
                >
                  {commonUi.resetFilters}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilterLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full app-panel px-3 py-1 text-sm app-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {errorMessage && (
            <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              {errorMessage}
            </section>
          )}

          <section className="rounded-[2rem] app-card p-6 sm:p-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
                  {mode === "projects"
                    ? dictionary.common.projects
                    : talentsLabel}
                </h2>
                <p className="mt-2 app-muted">{pageUi.resultsDescription}</p>
              </div>

              <span className="text-sm app-muted">
                {resultCount} {dictionary.search.results}
              </span>
            </div>

            {mode === "projects" ? (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      dictionary={dictionary}
                      project={project}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-[1.75rem] app-panel-dashed p-6 text-sm app-muted">
                  {pageUi.emptyMessage}
                </p>
              )
            ) : users.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    dictionary={dictionary}
                    creator={{
                      username: creator.username,
                      name: creator.name,
                      headline: creator.headline,
                      avatar_url: creator.avatar_url,
                      categoryName: creator.categoryName,
                      countryName: creator.countryName,
                      city: creator.city,
                      technologies: creator.technologies,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[1.75rem] app-panel-dashed p-6 text-sm app-muted">
                {pageUi.emptyMessage}
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
