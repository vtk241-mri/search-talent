import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfileShowcase from "@/components/public-profile-showcase";
import { getPublicProfilePageData } from "@/lib/db/public";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  buildMetadata,
  buildPersonSchema,
  buildBreadcrumbSchema,
  getMetadataBase,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getRouteParams(
  params: Promise<{ locale: string; username: string }>,
) {
  const { locale, username } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return {
    locale,
    username,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}): Promise<Metadata> {
  const { locale, username } = await getRouteParams(params);
  const dictionary = getDictionary(locale);
  const data = await getPublicProfilePageData(username);

  const displayName =
    data?.profile.name || data?.profile.username || null;
  const role =
    data?.profile.headline || data?.profile.categoryName || null;

  let title: string;
  if (displayName && role) {
    title = `${displayName} – ${role}`;
  } else if (displayName) {
    title = `${displayName} – ${dictionary.metadata.creatorProfile.title}`;
  } else {
    title = dictionary.metadata.creatorProfile.title;
  }

  const description = data?.profile.headline
    ? locale === "uk"
      ? `${data.profile.headline}. Перегляньте портфоліо, навички та проєкти ${displayName || "фахівця"} на SearchTalent.`
      : `${data.profile.headline}. Explore the portfolio, skills, and projects of ${displayName || "this specialist"} on SearchTalent.`
    : dictionary.metadata.creatorProfile.description;

  return buildMetadata({
    locale,
    pathname: `/u/${username}`,
    title,
    description,
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await getRouteParams(params);
  const dictionary = getDictionary(locale);
  const data = await getPublicProfilePageData(username);

  if (!data) {
    notFound();
  }

  const siteUrl = getMetadataBase().toString().replace(/\/$/, "");
  const profileUrl = `${siteUrl}/${locale}/u/${username}`;

  const personSchema = buildPersonSchema({
    name: data.profile.name,
    username: data.profile.username,
    headline: data.profile.headline,
    avatarUrl: data.profile.avatar_url,
    skills: data.technologies.map((t) => t.name),
    url: profileUrl,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: dictionary.nav.home, url: `${siteUrl}/${locale}` },
    { name: dictionary.common.creators, url: `${siteUrl}/${locale}/talents` },
    {
      name: data.profile.name || data.profile.username || dictionary.common.profile,
      url: profileUrl,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PublicProfileShowcase locale={locale} dictionary={dictionary} data={data} />
    </>
  );
}
