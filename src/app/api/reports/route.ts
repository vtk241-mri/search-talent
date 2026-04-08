import { NextResponse } from "next/server";
import { getReportPriority, normalizeModerationStatus } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { reportPayloadSchema } from "@/lib/validation/report";
import { parseJsonRequest } from "@/lib/validation/request";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonRequest(request, reportPayloadSchema);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const payload = parsed.data;

  const targetResponse =
    payload.targetType === "profile"
      ? await supabase
          .from("profiles")
          .select("id, user_id, moderation_status")
          .eq("id", payload.targetId)
          .maybeSingle()
      : await supabase
          .from("projects")
          .select("id, owner_id, moderation_status")
          .eq("id", payload.targetId)
          .maybeSingle();

  const target = targetResponse.data;

  if (!target) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const ownerUserId =
    payload.targetType === "profile"
      ? (target as { user_id: string }).user_id
      : (target as { owner_id: string }).owner_id;

  if (ownerUserId === user.id) {
    return NextResponse.json(
      { error: "You cannot report your own content" },
      { status: 400 },
    );
  }

  const duplicateQuery =
    payload.targetType === "profile"
      ? supabase
          .from("content_reports")
          .select("id")
          .eq("reporter_user_id", user.id)
          .eq("target_profile_id", payload.targetId)
          .eq("reason", payload.reason)
          .in("status", ["open", "triaged"])
          .maybeSingle()
      : supabase
          .from("content_reports")
          .select("id")
          .eq("reporter_user_id", user.id)
          .eq("target_project_id", payload.targetId)
          .eq("reason", payload.reason)
          .in("status", ["open", "triaged"])
          .maybeSingle();

  const { data: duplicateReport } = await duplicateQuery;

  if (duplicateReport) {
    return NextResponse.json(
      { error: "A similar active report already exists" },
      { status: 409 },
    );
  }

  const priority = getReportPriority(payload.reason);
  const { error: insertError } = await supabase.from("content_reports").insert({
    target_type: payload.targetType,
    target_profile_id: payload.targetType === "profile" ? payload.targetId : null,
    target_project_id: payload.targetType === "project" ? payload.targetId : null,
    target_owner_user_id: ownerUserId,
    reporter_user_id: user.id,
    reason: payload.reason,
    details: payload.details || null,
    priority,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message || "Could not create report" },
      { status: 400 },
    );
  }

  const currentStatus = normalizeModerationStatus(
    (target as { moderation_status?: string | null }).moderation_status,
  );

  if (priority === "urgent" && currentStatus !== "under_review") {
    const updatePayload = {
      moderation_status: "under_review",
      moderation_note:
        "Moved to review automatically after an urgent community report.",
      moderated_at: new Date().toISOString(),
    };

    if (payload.targetType === "profile") {
      await supabase.from("profiles").update(updatePayload).eq("id", payload.targetId);
    } else {
      await supabase.from("projects").update(updatePayload).eq("id", payload.targetId);
    }
  }

  return NextResponse.json({ success: true });
}
