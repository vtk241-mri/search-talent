import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { parseJsonRequest } from "@/lib/validation/request";

const feedbackSchema = z.object({
  name: z.string().max(100).optional().default(""),
  email: z.string().max(254).optional().default(""),
  category: z.enum(["idea", "bug", "feedback", "complaint"]),
  message: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const limited = rateLimit("feedback", 5, 60_000);

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const parsed = await parseJsonRequest(request, feedbackSchema);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error || "Invalid request" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id || null,
    name: parsed.data.name || null,
    email: parsed.data.email || null,
    category: parsed.data.category,
    message: parsed.data.message,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save feedback" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
