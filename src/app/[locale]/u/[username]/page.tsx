import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfileShowcase from "@/components/public-profile-showcase";
import { getPublicProfilePageData } from "@/lib/db/public";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

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

  return buildMetadata({
    locale,
    pathname: `/u/${username}`,
    title:
      data?.profile.name ||
      data?.profile.username ||
      dictionary.metadata.creatorProfile.title,
    description:
      data?.profile.headline || dictionary.metadata.creatorProfile.description,
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

  return <PublicProfileShowcase locale={locale} dictionary={dictionary} data={data} />;
}
