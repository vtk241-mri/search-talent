import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { getLegalDocument } from "@/lib/legal-content";
import { isLocale } from "@/lib/i18n/config";
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
  const content = getLegalDocument(locale, "terms");

  return buildMetadata({
    locale,
    pathname: "/terms",
    title: content.title,
    description: content.description,
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getLocaleValue(params);
  const content = getLegalDocument(locale, "terms");

  return <LegalPage {...content} />;
}
