import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootRedirectPage() {
  <SpeedInsights />;
  redirect(`/${defaultLocale}`);
}
