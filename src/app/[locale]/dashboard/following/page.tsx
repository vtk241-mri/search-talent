import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import LocalizedLink from "@/components/ui/localized-link";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
    pathname: "/dashboard/following",
    title: dictionary.follows.title,
    description: dictionary.follows.description,
  });
}

export default async function FollowingPage({
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

  const { data: follows } = await supabase
    .from("follows")
    .select("id, following_user_id, created_at")
    .eq("follower_user_id", user.id)
    .order("created_at", { ascending: false });

  const items = follows || [];
  const userIds = items.map((f) => f.following_user_id);

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, user_id, username, name, headline, avatar_url")
          .in("user_id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p]),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.25rem] app-card p-8 sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] app-soft">
              {dictionary.follows.title}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {dictionary.follows.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 app-muted">
              {dictionary.follows.description}
            </p>
          </div>
          <ButtonLink href="/dashboard" variant="ghost">
            {dictionary.dashboard.title}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] app-card p-6 sm:p-8">
        {items.length === 0 ? (
          <p className="text-sm app-muted">{dictionary.follows.emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const profile = profileMap.get(item.following_user_id);

              if (!profile) {
                return null;
              }

              return (
                <LocalizedLink
                  key={item.id}
                  href={`/u/${profile.username}`}
                  className="flex items-center gap-4 rounded-2xl app-panel p-4 transition hover:bg-[color:var(--surface-muted)]"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full app-panel text-sm font-semibold text-[color:var(--foreground)]">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name || profile.username || ""}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <span>
                        {(profile.name || profile.username || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--foreground)]">
                      {profile.name || profile.username}
                    </p>
                    {profile.headline && (
                      <p className="truncate text-sm app-muted">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                </LocalizedLink>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
