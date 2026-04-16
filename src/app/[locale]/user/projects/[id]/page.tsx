import { redirect } from "next/navigation";
import { createLocalePath, isLocale } from "@/lib/i18n/config";

export default async function UserProjectEditRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "en";
  redirect(createLocalePath(resolvedLocale, `/projects/edit/${id}`));
}
