import { redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";

export default async function DashboardArticlesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";

  redirect(createLocalePath(safeLocale, "/articles/new"));
}
