import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectVoteSummary = {
  likes: number;
  dislikes: number;
  score: number;
  currentVote: 1 | -1 | null;
};

export async function getProjectVoteSummary(
  supabase: SupabaseServerClient,
  projectId: string,
  userId?: string | null,
): Promise<ProjectVoteSummary> {
  const [
    { count: likesCount },
    { count: dislikesCount },
    currentVoteResponse,
  ] = await Promise.all([
    supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("value", 1),
    supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("value", -1),
    userId
      ? supabase
          .from("votes")
          .select("value")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .limit(1)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const likes = likesCount ?? 0;
  const dislikes = dislikesCount ?? 0;
  const currentVote =
    currentVoteResponse.data?.[0]?.value === 1 ||
    currentVoteResponse.data?.[0]?.value === -1
      ? currentVoteResponse.data[0].value
      : null;

  return {
    likes,
    dislikes,
    score: likes - dislikes,
    currentVote,
  };
}
