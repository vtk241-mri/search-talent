import { cookies } from "next/headers";
import { parseCookieConsentValue, cookieConsentCookieName } from "@/lib/cookie-consent";

export async function getCookieConsentFromCookies() {
  const cookieStore = await cookies();

  return parseCookieConsentValue(
    cookieStore.get(cookieConsentCookieName)?.value,
  );
}

