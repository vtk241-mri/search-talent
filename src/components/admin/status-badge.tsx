import type { ModerationStatus } from "@/lib/moderation";

type Props = {
  status: ModerationStatus | null;
  labels: Record<string, string>;
};

const STATUS_CLASSES: Record<ModerationStatus, string> = {
  approved:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  under_review:
    "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  restricted:
    "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  removed:
    "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default function StatusBadge({ status, labels }: Props) {
  const effective: ModerationStatus = status || "approved";
  const label = labels[effective] || labels.approved || effective;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASSES[effective],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
