import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentViewerRole } from "@/lib/moderation-server";

const routeSchema = z.object({
  id: z.string().uuid("Invalid feedback id"),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = routeSchema.safeParse(await params);

  if (!routeParams.success) {
    return NextResponse.json(
      { error: routeParams.error.issues[0]?.message || "Invalid feedback id" },
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

  const { error } = await context.supabase
    .from("feedback")
    .delete()
    .eq("id", routeParams.data.id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not delete feedback" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
