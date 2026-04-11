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
    <article className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur sm:p-5">
      <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/75 sm:mt-3 sm:leading-7">{description}</p>
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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-2xl border app-border bg-[linear-gradient(145deg,_rgba(15,23,42,0.98),_rgba(3,105,161,0.92)_50%,_rgba(245,158,11,0.84))] p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:rounded-[2.25rem] sm:p-8 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70 sm:text-sm">
              {dictionary.home.eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight sm:mt-4 sm:text-4xl md:text-5xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:mt-4 sm:text-base sm:leading-8">
              {dictionary.home.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
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

          <div className="grid gap-3 sm:gap-4">
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

      <div className="mt-6 sm:mt-10">
        <HomeTopRated
          dictionary={dictionary}
          creators={leaderboards.creators}
          projects={leaderboards.projects}
        />
      </div>
    </main>
  );
}
