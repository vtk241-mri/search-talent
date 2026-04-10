import type { Metadata } from "next";
import { cookies } from "next/headers";
import ThemeScript from "@/components/theme-script";
import {
  allowsCookieCategory,
  cookieConsentCookieName,
  parseCookieConsentValue,
} from "@/lib/cookie-consent";
import { defaultLocale, localeCookieName } from "@/lib/i18n/config";
import { getMetadataBase } from "@/lib/seo";
import { isTheme, themeCookieName } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "SearchTalent",
    template: "%s | SearchTalent",
  },
  description:
    "SearchTalent — find specialists, explore projects, and showcase your work in a bilingual talent platform.",
  icons: {
    icon: [{ url: "/favicon.webp", type: "image/webp" }],
    shortcut: "/favicon.webp",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value || defaultLocale;
  const consent = parseCookieConsentValue(
    cookieStore.get(cookieConsentCookieName)?.value,
  );
  const storedTheme = cookieStore.get(themeCookieName)?.value;
  const theme =
    allowsCookieCategory(consent, "preferences") &&
    storedTheme &&
    isTheme(storedTheme)
      ? storedTheme
      : "light";

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
