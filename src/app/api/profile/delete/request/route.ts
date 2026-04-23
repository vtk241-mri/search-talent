import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/profile/delete/request
 *
 * Triggers Supabase reauthentication: a 6-digit nonce is sent to the
 * user's email via the project's configured SMTP (template: "Reauthentication").
 * The timestamp is recorded in user_metadata so we can enforce a 5-minute TTL
 * on top of Supabase's default nonce expiry.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Account has no email on file" },
      { status: 400 },
    );
  }

  const limited =
    rateLimit(`account-delete-otp:${user.id}`, 1, 60_000) ||
    rateLimit(`account-delete-otp-hour:${user.id}`, 5, 60 * 60_000);

  if (limited) {
    return limited;
  }

  const adminClient = createAdminClient();

  if (adminClient) {
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        delete_otp_requested_at: new Date().toISOString(),
      },
    });
  }

  const { error: reauthError } = await supabase.auth.reauthenticate();

  if (reauthError) {
    return NextResponse.json(
      { error: reauthError.message || "Could not send the deletion code" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
