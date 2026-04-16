import { redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";

export default async function UserProjectsNewRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  redirect(createLocalePath(resolvedLocale, "/projects/new"));
}
