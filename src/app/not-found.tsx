import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import NotFoundState from "@/components/not-found-state";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
} from "@/lib/i18n/config";

export default async function GlobalNotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return (
    <AppShell locale={locale}>
      <NotFoundState locale={locale} />
    </AppShell>
  );
}
