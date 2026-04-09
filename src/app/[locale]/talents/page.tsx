import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { isLocale } from "@/lib/i18n/config";


const DiscoveryPage = dynamic(() => import("@/components/discovery-page"), {
  loading: () => (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-48 rounded-[2.25rem] bg-[color:var(--surface-muted)]" />
    </div>
  ),
});
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
    pathname: "/talents",
    title: dictionary.metadata.search.title,
    description: dictionary.metadata.search.description,
  });
}

export default async function LocalizedTalentsPage() {
  return <DiscoveryPage mode="creators" />;
}
