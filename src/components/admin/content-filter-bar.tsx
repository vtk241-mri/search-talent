"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  labels: {
    searchPlaceholder: string;
    filterStatus: string;
    filterAll: string;
    filterApproved: string;
    filterUnderReview: string;
    filterRestricted: string;
    filterRemoved: string;
  };
  showSearch?: boolean;
};

export default function ContentFilterBar({ labels, showSearch = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryFromUrl = searchParams.get("q") || "";
  const [committedQuery, setCommittedQuery] = useState(queryFromUrl);
  const [searchValue, setSearchValue] = useState(queryFromUrl);
  const [isPending, startTransition] = useTransition();

  if (committedQuery !== queryFromUrl) {
    setCommittedQuery(queryFromUrl);
    setSearchValue(queryFromUrl);
  }

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("q", searchValue.trim() || null);
  }

  const currentStatus = searchParams.get("status") || "all";

  const inputClass =
    "w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      aria-busy={isPending}
    >
      {showSearch ? (
        <div className="flex-1">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className={inputClass}
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm app-muted">
        <span className="hidden sm:inline">{labels.filterStatus}:</span>
        <select
          value={currentStatus}
          onChange={(event) =>
            updateParam(
              "status",
              event.target.value === "all" ? null : event.target.value,
            )
          }
          className={inputClass}
        >
          <option value="all">{labels.filterAll}</option>
          <option value="approved">{labels.filterApproved}</option>
          <option value="under_review">{labels.filterUnderReview}</option>
          <option value="restricted">{labels.filterRestricted}</option>
          <option value="removed">{labels.filterRemoved}</option>
        </select>
      </label>
    </form>
  );
}
