import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseJsonRequest } from "@/lib/validation/request";

const followPayloadSchema = z.object({
  followingUserId: z.string().uuid(),
});

/**
 * POST /api/follows — toggle follow (add if not following, remove if following).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`follow:${user.id}`, 30, 60_000);

  if (limited) {
    return limited;
  }

  const parsed = await parseJsonRequest(request, followPayloadSchema);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { followingUserId } = parsed.data;

  if (followingUserId === user.id) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_user_id", user.id)
    .eq("following_user_id", followingUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  const { error } = await supabase.from("follows").insert({
    follower_user_id: user.id,
    following_user_id: followingUserId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ following: true });
}
