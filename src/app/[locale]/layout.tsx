import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import CookieConsentBanner from "@/components/cookie-consent-banner";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { getAppShellData } from "@/lib/app-shell";
import { isLocale } from "@/lib/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const { dictionary, initialConsent, initialTheme, isSignedIn, viewer } =
    await getAppShellData(locale);

  return (
    <>
      <SiteHeader
        dictionary={dictionary}
        viewer={viewer}
        initialTheme={initialTheme}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter dictionary={dictionary} isSignedIn={isSignedIn} />
      <CookieConsentBanner initialConsent={initialConsent} />
    </>
  );
}
