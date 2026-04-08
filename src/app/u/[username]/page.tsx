import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

export default async function LegacyUserProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  redirect(`/${defaultLocale}/u/${username}`);
}

