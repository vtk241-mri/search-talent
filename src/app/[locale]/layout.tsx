import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
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

  return <AppShell locale={locale}>{children}</AppShell>;
}
