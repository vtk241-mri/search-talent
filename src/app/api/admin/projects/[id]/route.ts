import { NextResponse } from "next/server";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { routeProjectIdSchema } from "@/lib/validation/project";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = routeProjectIdSchema.safeParse(await params);

  if (!routeParams.success) {
    return NextResponse.json(
      { error: routeParams.error.issues[0]?.message || "Invalid project id" },
      { status: 400 },
    );
  }

  const context = await getCurrentViewerRole();

  if (!context.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!context.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = routeParams.data;
  const { data: project, error: projectError } = await context.supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 400 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: mediaItems, error: mediaError } = await context.supabase
    .from("project_media")
    .select("storage_path")
    .eq("project_id", project.id);

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 400 });
  }

  const { error: deleteError } = await context.supabase
    .from("projects")
    .delete()
    .eq("id", project.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "Could not delete project" },
      { status: 400 },
    );
  }

  const storagePaths = [
    ...new Set(
      (mediaItems || [])
        .map((item) => (item as { storage_path: string | null }).storage_path?.trim())
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (storagePaths.length > 0) {
    const { error: storageError } = await context.supabase.storage
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
