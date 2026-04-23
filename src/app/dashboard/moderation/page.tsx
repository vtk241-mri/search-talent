import { redirect } from "next/navigation";

export default function LegacyDashboardModerationRedirect() {
  redirect("/admin/moderation");
}
