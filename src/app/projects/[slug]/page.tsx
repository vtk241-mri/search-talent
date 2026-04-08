import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function LegacyProjectRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  redirect(`/${defaultLocale}/projects/${slug}`);
}
