export const moderationStatuses = [
  "approved",
  "under_review",
  "restricted",
  "removed",
] as const;

export const reportTargetTypes = ["profile", "project"] as const;

export const reportReasons = [
  "copyright_infringement",
  "inappropriate_content",
  "harmful_or_dangerous",
  "sexual_content",
  "harassment_or_hate",
  "spam_or_scam",
  "impersonation",
  "other",
] as const;

export const reportStatuses = ["open", "triaged", "resolved", "dismissed"] as const;
export const moderationPriorities = ["normal", "high", "urgent"] as const;

export type ModerationStatus = (typeof moderationStatuses)[number];
export type ReportTargetType = (typeof reportTargetTypes)[number];
export type ReportReason = (typeof reportReasons)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ModerationPriority = (typeof moderationPriorities)[number];

export function normalizeModerationStatus(
  value: string | null | undefined,
): ModerationStatus | null {
  return moderationStatuses.includes(value as ModerationStatus)
    ? (value as ModerationStatus)
    : null;
}

export function isPublicModerationStatus(value: string | null | undefined) {
  const normalized = normalizeModerationStatus(value);
  return normalized === null || normalized === "approved";
}

export function getReportPriority(reason: ReportReason): ModerationPriority {
  switch (reason) {
    case "sexual_content":
    case "harmful_or_dangerous":
    case "harassment_or_hate":
      return "urgent";
    case "copyright_infringement":
    case "impersonation":
    case "spam_or_scam":
      return "high";
    default:
      return "normal";
  }
}

export function getModerationActionType(
  currentStatus: ModerationStatus | null,
  nextStatus: ModerationStatus,
) {
  if (currentStatus === nextStatus) {
    return nextStatus === "approved" ? "confirm_approved" : "update_status";
  }

  switch (nextStatus) {
    case "approved":
      return currentStatus === "removed" || currentStatus === "restricted"
        ? "restore"
        : "approve";
    case "under_review":
      return "send_to_review";
    case "restricted":
      return "restrict";
    case "removed":
      return "remove";
    default:
      return "update_status";
  }
}
