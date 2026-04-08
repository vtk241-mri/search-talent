import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routeArticleIdSchema } from "@/lib/validation/articles";

export async function DELETE(
  _request: Request,
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

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, author_user_id, cover_image_storage_path, hero_video_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (articleError) {
    return NextResponse.json({ error: articleError.message }, { status: 400 });
  }

  if (!article || article.author_user_id !== user.id) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)
    .eq("author_user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "Could not delete article" },
      { status: 400 },
    );
  }

  const storagePaths = [
    article.cover_image_storage_path?.trim(),
    article.hero_video_storage_path?.trim(),
  ].filter((item): item is string => Boolean(item));

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove(storagePaths);

    if (storageError) {
      return NextResponse.json({
        success: true,
        cleanupWarning: storageError.message,
      });
    }
  }

  return NextResponse.json({ success: true });
}
