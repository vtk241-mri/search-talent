import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function LegacyProjectsByTagRedirect({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  redirect(`/${defaultLocale}/projects/tag/${tag}`);
}
