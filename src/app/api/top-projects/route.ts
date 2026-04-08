import { NextResponse } from "next/server";
import { getLeaderboards } from "@/lib/db/leaderboards";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") === "month" ? "month" : "all";
  const leaderboards = await getLeaderboards();

  return NextResponse.json(leaderboards.projects[timeframe], {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
