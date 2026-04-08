"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  id: number;
  name: string;
};

export default function SearchSelect({
  options,
  value,
  placeholder,
  onChange,
}: {
  options: Option[];
  value?: number;
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.id === value) || null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.name.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

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
        <span className={selectedOption ? "" : "app-muted"}>
          {selectedOption?.name || placeholder}
        </span>
        <span className="text-xs app-muted">{isOpen ? "^" : "v"}</span>
      </button>

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
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm app-muted transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            >
              <span>{placeholder}</span>
              {!selectedOption && <span>✓</span>}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.id === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-muted)]"
                  >
                    <span>{option.name}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm app-muted">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
