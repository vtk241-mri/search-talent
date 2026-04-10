import { NextResponse } from "next/server";
import {
  getModerationActionType,
  normalizeModerationStatus,
} from "@/lib/moderation";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { moderationUpdateSchema } from "@/lib/validation/report";
import { parseJsonRequest } from "@/lib/validation/request";

export async function POST(request: Request) {
  const context = await getCurrentViewerRole();

  if (!context.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!context.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonRequest(request, moderationUpdateSchema);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const payload = parsed.data;
  const { supabase, user } = context;

  const targetResponse =
    payload.targetType === "profile"
      ? await supabase
          .from("profiles")
          .select("id, moderation_status")
          .eq("id", payload.targetId)
          .maybeSingle()
      : payload.targetType === "article"
        ? await supabase
            .from("articles")
            .select("id, moderation_status")
            .eq("id", payload.targetId)
            .maybeSingle()
        : await supabase
            .from("projects")
            .select("id, moderation_status")
            .eq("id", payload.targetId)
            .maybeSingle();

  const target = targetResponse.data as
    | { id: string; moderation_status: string | null }
    | null;

  if (!target) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const previousStatus = normalizeModerationStatus(target.moderation_status);
  const targetUpdate = {
    moderation_status: payload.moderationStatus,
    moderation_note: payload.resolutionNote || null,
    moderated_at: new Date().toISOString(),
    moderated_by: user.id,
  };

  const targetUpdateResponse =
    payload.targetType === "profile"
      ? await supabase.from("profiles").update(targetUpdate).eq("id", payload.targetId)
      : payload.targetType === "article"
        ? await supabase.from("articles").update(targetUpdate).eq("id", payload.targetId)
        : await supabase.from("projects").update(targetUpdate).eq("id", payload.targetId);

  if (targetUpdateResponse.error) {
    return NextResponse.json(
      { error: targetUpdateResponse.error.message || "Could not update content moderation" },
      { status: 400 },
    );
  }

  if (payload.reportId) {
    const { error: reportError } = await supabase
      .from("content_reports")
      .update({
        status: payload.reportStatus || "resolved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        resolution_note: payload.resolutionNote || null,
      })
      .eq("id", payload.reportId);

    if (reportError) {
      return NextResponse.json(
        { error: reportError.message || "Could not update report status" },
        { status: 400 },
      );
    }
  }

  const { error: actionError } = await supabase.from("moderation_actions").insert({
    actor_user_id: user.id,
    report_id: payload.reportId || null,
    target_type: payload.targetType,
    target_profile_id: payload.targetType === "profile" ? payload.targetId : null,
    target_project_id: payload.targetType === "project" ? payload.targetId : null,
    target_article_id: payload.targetType === "article" ? payload.targetId : null,
    previous_status: previousStatus,
    next_status: payload.moderationStatus,
    report_status: payload.reportStatus || null,
    action_type: getModerationActionType(previousStatus, payload.moderationStatus),
    note: payload.resolutionNote || null,
  });

  if (actionError) {
    return NextResponse.json(
      { error: actionError.message || "Could not store moderation action" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
