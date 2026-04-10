import type { MetadataRoute } from "next";
import { createLocalePath, locales } from "@/lib/i18n/config";
import { getMetadataBase } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

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

function buildEntry(baseUrl: URL, route: string, lastModified: Date): MetadataRoute.Sitemap[number] {
  return {
    url: new URL(createLocalePath(locales[0], route), baseUrl).toString(),
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [
          locale,
          new URL(createLocalePath(locale, route), baseUrl).toString(),
        ]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getMetadataBase();

  const staticEntries = staticRoutes.map((route) =>
    buildEntry(baseUrl, route, new Date()),
  );

  const supabase = await createClient();

  const [profilesResponse, projectsResponse, articlesResponse] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, updated_at")
        .eq("moderation_status", "approved")
        .not("username", "is", null)
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("projects")
        .select("slug, updated_at")
        .eq("moderation_status", "approved")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("articles")
        .select("slug, updated_at")
        .eq("status", "published")
        .eq("moderation_status", "approved")
        .order("updated_at", { ascending: false })
        .limit(5000),
    ]);

  const profileEntries = (profilesResponse.data || []).map((profile) =>
    buildEntry(
      baseUrl,
      `/u/${profile.username}`,
      new Date(profile.updated_at),
    ),
  );

  const projectEntries = (projectsResponse.data || []).map((project) =>
    buildEntry(
      baseUrl,
      `/projects/${project.slug}`,
      new Date(project.updated_at),
    ),
  );

  const articleEntries = (articlesResponse.data || []).map((article) =>
    buildEntry(
      baseUrl,
      `/articles/${article.slug}`,
      new Date(article.updated_at),
    ),
  );

  return [
    ...staticEntries,
    ...profileEntries,
    ...projectEntries,
    ...articleEntries,
  ];
}
