import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import HomeTopRated from "@/components/home-top-rated";
import { getLeaderboards } from "@/lib/db/leaderboards";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

async function getLocaleValue(params: Promise<{ locale: string }>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return locale;
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
    pathname: "/",
    title: dictionary.metadata.home.title,
    description: dictionary.metadata.home.description,
  });
}

function HomeCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-white/75">{description}</p>
    </article>
  );
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await getLocaleValue(params)) as Locale;
  const dictionary = getDictionary(locale);
  const leaderboards = await getLeaderboards();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-[2.25rem] border app-border bg-[linear-gradient(145deg,_rgba(15,23,42,0.98),_rgba(3,105,161,0.92)_50%,_rgba(245,158,11,0.84))] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
              {dictionary.home.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/80">
              {dictionary.home.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/projects" size="lg">
                {dictionary.home.browseProjects}
              </ButtonLink>
              <ButtonLink href="/talents" variant="secondary" size="lg">
                {dictionary.home.searchCreators}
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="ghost" size="lg">
                {dictionary.home.openDashboard}
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            <HomeCard
              title={dictionary.home.cards.discovery.title}
              description={dictionary.home.cards.discovery.description}
            />
            <HomeCard
              title={dictionary.home.cards.creators.title}
              description={dictionary.home.cards.creators.description}
            />
            <HomeCard
              title={dictionary.home.cards.teams.title}
              description={dictionary.home.cards.teams.description}
            />
          </div>
        </div>
      </section>

      <div className="mt-10">
        <HomeTopRated
          dictionary={dictionary}
          creators={leaderboards.creators}
          projects={leaderboards.projects}
        />
      </div>
    </main>
  );
}
