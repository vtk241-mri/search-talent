import { notFound, redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export default async function UserProjectsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(createLocalePath(resolvedLocale, "/login"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.username) {
    redirect(createLocalePath(resolvedLocale, `/u/${profile.username}/projects`));
  }

  redirect(createLocalePath(resolvedLocale, "/profile/edit"));
}
