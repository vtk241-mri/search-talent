import { cookies } from "next/headers";
import {
  allowsCookieCategory,
  cookieConsentCookieName,
  parseCookieConsentValue,
} from "@/lib/cookie-consent";

export const themeCookieName = "theme";
export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

export function isTheme(value: string): value is Theme {
  return themes.includes(value as Theme);
}

export async function getThemeFromCookies() {
  const cookieStore = await cookies();
  const consent = parseCookieConsentValue(
    cookieStore.get(cookieConsentCookieName)?.value,
  );

  if (!allowsCookieCategory(consent, "preferences")) {
    return "light";
  }

  const value = cookieStore.get(themeCookieName)?.value;

  return value && isTheme(value) ? value : "light";
}
