"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  labels: {
    searchPlaceholder: string;
    filterRole: string;
    filterStatus: string;
    filterAny: string;
    filterAdmins: string;
    filterUsers: string;
    filterApproved: string;
    filterUnderReview: string;
    filterRestricted: string;
    filterRemoved: string;
  };
};

export default function UsersFilterBar({ labels }: Props) {
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

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("q", searchValue.trim() || null);
  }

  const currentRole = searchParams.get("role") || "all";
  const currentStatus = searchParams.get("status") || "all";

  const inputClass =
    "w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
  const selectClass = inputClass;

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      aria-busy={isPending}
    >
      <div className="flex-1">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm app-muted">
        <span className="hidden sm:inline">{labels.filterRole}:</span>
        <select
          value={currentRole}
          onChange={(event) =>
            updateParam("role", event.target.value === "all" ? null : event.target.value)
          }
          className={selectClass}
        >
          <option value="all">{labels.filterAny}</option>
          <option value="admin">{labels.filterAdmins}</option>
          <option value="user">{labels.filterUsers}</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm app-muted">
        <span className="hidden sm:inline">{labels.filterStatus}:</span>
        <select
          value={currentStatus}
          onChange={(event) =>
            updateParam("status", event.target.value === "all" ? null : event.target.value)
          }
          className={selectClass}
        >
          <option value="all">{labels.filterAny}</option>
          <option value="approved">{labels.filterApproved}</option>
          <option value="under_review">{labels.filterUnderReview}</option>
          <option value="restricted">{labels.filterRestricted}</option>
          <option value="removed">{labels.filterRemoved}</option>
        </select>
      </label>
    </form>
  );
}
