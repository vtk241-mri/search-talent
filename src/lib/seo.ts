import type { Metadata } from "next";
import {
  createLocalePath,
  defaultLocale,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function buildMetadata({
  locale,
  pathname,
  title,
  description,
}: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  const dictionary = getDictionary(locale);
  const canonicalPath = createLocalePath(locale, pathname);

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...Object.fromEntries(
          locales.map((item) => [
            item,
            new URL(
              createLocalePath(item, pathname),
              getMetadataBase(),
            ).toString(),
          ]),
        ),
        "x-default": new URL(
          createLocalePath(defaultLocale, pathname),
          getMetadataBase(),
        ).toString(),
      },
    },
    openGraph: {
      type: "website",
      url: new URL(canonicalPath, getMetadataBase()),
      locale: locale === "uk" ? "uk_UA" : "en_US",
      title,
      description,
      siteName: dictionary.site.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
