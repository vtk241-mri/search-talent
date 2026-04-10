import { NextResponse } from "next/server";
import { getWilsonScore } from "@/lib/leaderboards";
import { getCurrentViewerRole } from "@/lib/moderation-server";

/**
 * POST /api/admin/refresh-scores
 *
 * Recomputes the persisted `score` column (Wilson-based, 0-100) on every
 * project and profile. Call this after bulk edits, media uploads, or data
 * migrations — any time vote-based scores may have drifted.
 *
 * Requires admin authentication.
 */
export async function POST() {
  const context = await getCurrentViewerRole();

  if (!context.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!context.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase } = context;

  // ---- refresh project scores -------------------------------------------

  const [projectsRes, projectVotesRes] = await Promise.all([
    supabase.from("projects").select("id"),
    supabase.from("votes").select("project_id, value"),
  ]);

  const projectIds = (projectsRes.data || []) as Array<{ id: string }>;
  const projectVotes = (projectVotesRes.data || []) as Array<{
    project_id: string;
    value: number;
  }>;

  const projectVoteCounts = new Map<
    string,
    { likes: number; dislikes: number }
  >();
  for (const v of projectVotes) {
    const c = projectVoteCounts.get(v.project_id) || {
      likes: 0,
      dislikes: 0,
    };
    if (v.value === 1) c.likes += 1;
    if (v.value === -1) c.dislikes += 1;
    projectVoteCounts.set(v.project_id, c);
  }

  let projectsUpdated = 0;
  for (const { id } of projectIds) {
    const c = projectVoteCounts.get(id) || { likes: 0, dislikes: 0 };
    const score = Math.round(getWilsonScore(c.likes, c.dislikes) * 100);
    await supabase.from("projects").update({ score }).eq("id", id);
    projectsUpdated += 1;
  }

  // ---- refresh profile scores -------------------------------------------

  const [profilesRes, profileVotesRes] = await Promise.all([
    supabase.from("profiles").select("id"),
    supabase
      .from("profile_votes")
      .select("profile_id, value")
      .then((r) => (r.error ? { data: [] } : r)),
  ]);

  const profileIds = (profilesRes.data || []) as Array<{ id: string }>;
  const profileVotes = (profileVotesRes.data || []) as Array<{
    profile_id: string;
    value: number;
  }>;

  const profileVoteCounts = new Map<
    string,
    { likes: number; dislikes: number }
  >();
  for (const v of profileVotes) {
    const c = profileVoteCounts.get(v.profile_id) || {
      likes: 0,
      dislikes: 0,
    };
    if (v.value === 1) c.likes += 1;
    if (v.value === -1) c.dislikes += 1;
    profileVoteCounts.set(v.profile_id, c);
  }

  let profilesUpdated = 0;
  for (const { id } of profileIds) {
    const c = profileVoteCounts.get(id) || { likes: 0, dislikes: 0 };
    const score = Math.round(getWilsonScore(c.likes, c.dislikes) * 100);
    await supabase.from("profiles").update({ score }).eq("id", id);
    profilesUpdated += 1;
  }

  return NextResponse.json({
    success: true,
    projectsUpdated,
    profilesUpdated,
  });
}
