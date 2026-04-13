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

/* ------------------------------------------------------------------ */
/*  Schema.org JSON-LD helpers                                        */
/* ------------------------------------------------------------------ */

export function buildOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SearchTalent",
    url: siteUrl,
    logo: `${siteUrl}/favicon.webp`,
    description:
      "SearchTalent — the best platform to hire freelancers, explore creative portfolios, and discover IT projects.",
    sameAs: [],
  };
}

export function buildWebSiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SearchTalent",
    url: siteUrl,
    description:
      "The best freelancing platform to search talent, explore portfolios, and hire developers and designers.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/en/talents?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildPersonSchema({
  name,
  username,
  headline,
  avatarUrl,
  skills,
  url,
}: {
  name: string | null;
  username: string | null;
  headline: string | null;
  avatarUrl: string | null;
  skills: string[];
  url: string;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name || username || "Specialist",
    url,
    ...(headline ? { jobTitle: headline } : {}),
    ...(avatarUrl ? { image: avatarUrl } : {}),
    ...(skills.length > 0 ? { knowsAbout: skills } : {}),
    memberOf: {
      "@type": "Organization",
      name: "SearchTalent",
      url: siteUrl,
    },
  };
}

export function buildProjectSchema({
  title,
  description,
  url,
  imageUrl,
  authorName,
  authorUrl,
  technologies,
  dateCreated,
}: {
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  technologies: string[];
  dateCreated: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    ...(description ? { description } : {}),
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(authorName
      ? {
          author: {
            "@type": "Person",
            name: authorName,
            ...(authorUrl ? { url: authorUrl } : {}),
          },
        }
      : {}),
    ...(technologies.length > 0 ? { keywords: technologies.join(", ") } : {}),
    ...(dateCreated ? { dateCreated } : {}),
  };
}

export function buildArticleSchema({
  title,
  excerpt,
  url,
  imageUrl,
  authorName,
  authorUrl,
  datePublished,
  dateModified,
}: {
  title: string;
  excerpt: string | null;
  url: string;
  imageUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  datePublished: string | null;
  dateModified: string | null;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(excerpt ? { description: excerpt } : {}),
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(authorName
      ? {
          author: {
            "@type": "Person",
            name: authorName,
            ...(authorUrl ? { url: authorUrl } : {}),
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "SearchTalent",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.webp`,
      },
    },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
