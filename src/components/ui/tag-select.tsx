"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  id: number;
  name: string;
};

export default function TagSelect({
  options,
  value = [],
  placeholder,
  onChange,
}: {
  options: Option[];
  value?: number[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedValues = useMemo(() => new Set(value), [value]);
  const selectedOptions = options.filter((option) => selectedValues.has(option.id));
  const selectedSummary =
    selectedOptions.length > 0
      ? selectedOptions.slice(0, 2).map((option) => option.name).join(", ") +
        (selectedOptions.length > 2 ? ` +${selectedOptions.length - 2}` : "")
      : placeholder;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return options.filter((option) => {
      if (selectedValues.has(option.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return option.name.toLowerCase().includes(normalizedQuery);
    });
  }, [options, query, selectedValues]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border app-border bg-[color:var(--surface)] px-4 py-3 text-left text-[color:var(--foreground)]"
      >
        <span className={selectedOptions.length > 0 ? "" : "app-muted"}>
          {selectedSummary}
        </span>
        <span className="text-xs app-muted">{isOpen ? "^" : "v"}</span>
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange(value.filter((item) => item !== option.id).map(String))
              }
              className="rounded-full border app-border px-3 py-1 text-sm app-muted transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            >
              {option.name} ×
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border app-border bg-[color:var(--surface)] p-3 shadow-xl">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border app-border bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--foreground)]"
            autoFocus
          />

          <div className="mt-3 max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange([...value, option.id].map(String));
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]"
                >
                  <span>{option.name}</span>
                  <span>+</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm app-muted">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
