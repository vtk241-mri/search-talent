import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export { default } from "@/app/(auth)/signup/page";

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
    pathname: "/signup",
    title: dictionary.metadata.signup.title,
    description: dictionary.metadata.signup.description,
    noindex: true,
  });
}
