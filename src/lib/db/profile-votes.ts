import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProfileVoteSummary = {
  likes: number;
  dislikes: number;
  score: number;
  currentVote: 1 | -1 | null;
};

export async function getProfileVoteSummary(
  supabase: SupabaseServerClient,
  profileId: string,
  userId?: string | null,
): Promise<ProfileVoteSummary> {
  const [
    likesResponse,
    dislikesResponse,
    currentVoteResponse,
  ] = await Promise.all([
    supabase
      .from("profile_votes")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("value", 1),
    supabase
      .from("profile_votes")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("value", -1),
    userId
      ? supabase
          .from("profile_votes")
          .select("value")
          .eq("profile_id", profileId)
          .eq("user_id", userId)
          .limit(1)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (likesResponse.error || dislikesResponse.error || currentVoteResponse.error) {
    return {
      likes: 0,
      dislikes: 0,
      score: 0,
      currentVote: null,
    };
  }

  const likes = likesResponse.count ?? 0;
  const dislikes = dislikesResponse.count ?? 0;
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
