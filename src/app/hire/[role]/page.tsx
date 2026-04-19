import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function LegacyHireRoleRedirect({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

  redirect(`/${defaultLocale}/hire/${role}`);
}
