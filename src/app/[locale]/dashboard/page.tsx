import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import DashboardAnalytics from "@/components/dashboard-analytics";
import { ButtonLink } from "@/components/ui/Button";
import { getDashboardStats } from "@/lib/db/dashboard";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

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
    pathname: "/dashboard",
    title: dictionary.metadata.dashboard.title,
    description: dictionary.metadata.dashboard.description,
  });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getLocaleValue(params);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(createLocalePath(locale, "/login"));
  }

  const dictionary = getDictionary(locale);
  const viewer = await getCurrentViewerRole();
  const stats = await getDashboardStats();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] app-soft">
            {dictionary.dashboard.analyticsEyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {dictionary.metadata.dashboard.title}
          </h1>
        </div>
        <ButtonLink href="/talents" variant="ghost" size="sm">
          {dictionary.search.title}
        </ButtonLink>
      </div>

      <DashboardAnalytics
        dictionary={dictionary}
        locale={locale}
        stats={stats}
        isAdmin={viewer.isAdmin}
      />
    </main>
  );
}
