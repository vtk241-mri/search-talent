import { NextResponse } from "next/server";
import { isPublicModerationStatus } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { articleCommentPayloadSchema, routeArticleIdSchema } from "@/lib/validation/articles";
import { parseJsonRequest } from "@/lib/validation/request";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = routeArticleIdSchema.safeParse(await params);

  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.issues[0]?.message || "Invalid article id" }, { status: 400 });
  }

  const { id } = routeParams.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonRequest(request, articleCommentPayloadSchema);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: article } = await supabase
    .from("articles")
    .select("id, status, moderation_status")
    .eq("id", id)
    .maybeSingle();

  if (!article || article.status !== "published" || !isPublicModerationStatus(article.moderation_status)) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { error } = await supabase.from("article_comments").insert({
    article_id: id,
    author_user_id: user.id,
    parent_id: parsed.data.parent_id,
    body: parsed.data.body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
