import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { createAdminClient } from "@/lib/supabase/admin";

const routeSchema = z.object({
  id: z.string().uuid("Invalid profile id"),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = routeSchema.safeParse(await params);

  if (!routeParams.success) {
    return NextResponse.json(
      { error: routeParams.error.issues[0]?.message || "Invalid profile id" },
      { status: 400 },
    );
  }

  const context = await getCurrentViewerRole();

  if (!context.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!context.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = routeParams.data;

  const { data: profile, error: profileError } = await context.supabase
    .from("profiles")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.user_id === context.user.id) {
    return NextResponse.json(
      { error: "Admins cannot delete their own profile from here" },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Admin client is not configured" },
      { status: 500 },
    );
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
    profile.user_id,
  );

  if (authDeleteError) {
    return NextResponse.json(
      { error: authDeleteError.message || "Could not delete user account" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
