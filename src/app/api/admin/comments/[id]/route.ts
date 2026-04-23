import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentViewerRole } from "@/lib/moderation-server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const querySchema = z.object({
  kind: z.enum(["article", "project"]),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentViewerRole();
  if (!context.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const routeParams = paramsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json(
      { error: routeParams.error.issues[0]?.message || "Invalid comment id" },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const query = querySchema.safeParse({ kind: url.searchParams.get("kind") });
  if (!query.success) {
    return NextResponse.json(
      { error: "kind must be article or project" },
      { status: 400 },
    );
  }

  const { supabase } = context;
  const table =
    query.data.kind === "article" ? "article_comments" : "project_comments";

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", routeParams.data.id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
