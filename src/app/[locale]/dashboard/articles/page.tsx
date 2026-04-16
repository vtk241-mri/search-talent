import { redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardArticlesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(createLocalePath(safeLocale, "/login"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.username) {
    redirect(createLocalePath(safeLocale, `/u/${profile.username}/articles`));
  }

  redirect(createLocalePath(safeLocale, "/articles/new"));
}
