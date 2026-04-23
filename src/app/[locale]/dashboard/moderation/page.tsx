import { notFound, redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";

export default async function LegacyModerationRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  redirect(createLocalePath(locale, "/admin/moderation"));
}
