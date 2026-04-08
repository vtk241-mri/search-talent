import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const [
    { data: countries },
    { data: languages },
    { data: skills },
    { data: categories },
  ] = await Promise.all([
    supabase.from("countries").select("*").order("name"),
    supabase.from("languages").select("*").order("name"),
    supabase.from("skills").select("*").order("name"),
    supabase.from("profile_categories").select("id, name").order("name"),
  ]);

  return NextResponse.json(
    {
      countries,
      languages,
      skills,
      categories: (categories || []).map((category) => ({
        ...category,
        slug: null,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
