import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseJsonRequest } from "@/lib/validation/request";

const bookmarkPayloadSchema = z.object({
  targetType: z.enum(["profile", "project"]),
  targetId: z.string().uuid(),
});

/**
 * GET /api/bookmarks — list the current user's bookmarks with basic info.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, target_type, target_profile_id, target_project_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const profileIds = (bookmarks || [])
    .filter((b) => b.target_type === "profile" && b.target_profile_id)
    .map((b) => b.target_profile_id as string);

  const projectIds = (bookmarks || [])
    .filter((b) => b.target_type === "project" && b.target_project_id)
    .map((b) => b.target_project_id as string);

  const [profilesResponse, projectsResponse] = await Promise.all([
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, name, headline, avatar_url")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase
          .from("projects")
          .select("id, title, slug, description, cover_url, score")
          .in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profilesResponse.data || []).map((p) => [p.id, p]),
  );
  const projectMap = new Map(
    (projectsResponse.data || []).map((p) => [p.id, p]),
  );

  const enriched = (bookmarks || []).map((b) => ({
    ...b,
    profile: b.target_profile_id ? profileMap.get(b.target_profile_id) || null : null,
    project: b.target_project_id ? projectMap.get(b.target_project_id) || null : null,
  }));

  return NextResponse.json({ bookmarks: enriched });
}

/**
 * POST /api/bookmarks — toggle a bookmark (add if missing, remove if exists).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`bookmark:${user.id}`, 30, 60_000);

  if (limited) {
    return limited;
  }

  const parsed = await parseJsonRequest(request, bookmarkPayloadSchema);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { targetType, targetId } = parsed.data;
  const targetColumn =
    targetType === "profile" ? "target_profile_id" : "target_project_id";

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq(targetColumn, targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return NextResponse.json({ bookmarked: false });
  }

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    target_type: targetType,
    target_profile_id: targetType === "profile" ? targetId : null,
    target_project_id: targetType === "project" ? targetId : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ bookmarked: true });
}
