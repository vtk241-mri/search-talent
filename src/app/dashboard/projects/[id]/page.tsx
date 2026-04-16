import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function LegacyDashboardProjectEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/${defaultLocale}/projects/edit/${id}`);
}
