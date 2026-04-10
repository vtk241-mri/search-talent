import type { MetadataRoute } from "next";
import { createLocalePath, locales } from "@/lib/i18n/config";
import { getMetadataBase } from "@/lib/seo";

const staticRoutes = [
  "/",
  "/talents",
  "/projects",
  "/legal",
  "/terms",
  "/privacy",
  "/cookies",
  "/login",
  "/signup",
  "/verify",
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/profile",
  "/articles",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getMetadataBase();

  return locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: new URL(createLocalePath(locale, route), baseUrl).toString(),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((item) => [
            item,
            new URL(createLocalePath(item, route), baseUrl).toString(),
          ]),
        ),
      },
    })),
  );
}
