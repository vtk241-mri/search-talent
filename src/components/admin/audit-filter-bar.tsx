"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  labels: {
    action: string;
    target: string;
    all: string;
  };
  actionOptions: Array<{ value: string; label: string }>;
  targetOptions: Array<{ value: string; label: string }>;
};

export default function AuditFilterBar({
  labels,
  actionOptions,
  targetOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("before");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const currentAction = searchParams.get("action") || "all";
  const currentTarget = searchParams.get("target") || "all";

  const selectClass =
    "rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      aria-busy={isPending}
    >
      <label className="flex items-center gap-2 text-sm app-muted">
        <span>{labels.action}:</span>
        <select
          value={currentAction}
          onChange={(event) =>
            updateParam(
              "action",
              event.target.value === "all" ? null : event.target.value,
            )
          }
          className={selectClass}
        >
          <option value="all">{labels.all}</option>
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm app-muted">
        <span>{labels.target}:</span>
        <select
          value={currentTarget}
          onChange={(event) =>
            updateParam(
              "target",
              event.target.value === "all" ? null : event.target.value,
            )
          }
          className={selectClass}
        >
          <option value="all">{labels.all}</option>
          {targetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
