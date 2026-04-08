import { getCookieConsentFromCookies } from "@/lib/cookie-consent-server";
import type { CookieConsent } from "@/lib/cookie-consent";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getThemeFromCookies, type Theme } from "@/lib/theme";

export type AppViewer = {
  displayName: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
} | null;

export async function getAppShellData(locale: Locale): Promise<{
  dictionary: Dictionary;
  initialConsent: CookieConsent | null;
  initialTheme: Theme;
  isSignedIn: boolean;
  viewer: AppViewer;
}> {
  const supabase = await createClient();
  const [{ data: auth }, initialConsent, initialTheme] = await Promise.all([
    supabase.auth.getUser(),
    getCookieConsentFromCookies(),
    getThemeFromCookies(),
  ]);

  const user = auth.user;

  let viewer: AppViewer = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, username, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    viewer = {
      displayName: profile?.name || null,
      email: user.email || null,
      username: profile?.username || null,
      avatarUrl: profile?.avatar_url || null,
    };
  }

  return {
    dictionary: getDictionary(locale),
    initialConsent,
    initialTheme,
    isSignedIn: Boolean(user),
    viewer,
  };
}
