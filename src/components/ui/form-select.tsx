"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type SelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = {
  options: SelectOption[];
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  emptyLabel?: string;
  noResultsLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function FormSelect({
  options,
  value,
  onChange,
  placeholder,
  name,
  emptyLabel = "No options available",
  noResultsLabel,
  disabled = false,
  className,
  triggerClassName,
  dropdownClassName,
}: FormSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const listboxId = useId();

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const currentValue = onChange ? value : internalValue;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === currentValue) ?? null,
    [currentValue, options],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const visibleOptions =
    placeholder !== undefined
      ? [{ label: placeholder, value: "" }, ...options]
      : options;

  const resolvedEmptyLabel = noResultsLabel || emptyLabel;

  return (
    <div ref={wrapperRef} className={cx("relative", className)}>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        data-open={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        className={cx("app-select-trigger", triggerClassName)}
      >
        <span className={selectedOption ? "" : "app-muted"}>
          {selectedOption?.label || placeholder || emptyLabel}
        </span>

        <svg
          className="app-select-chevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className={cx("app-select-dropdown", dropdownClassName)}>
          <div
            id={listboxId}
            role="listbox"
            className="app-select-dropdown-inner"
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const isSelected = option.value === currentValue;
                const isPlaceholderOption = option.value === "";

                return (
                  <button
                    key={`${option.value || "__empty__"}-${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    data-placeholder={isPlaceholderOption}
                    className="app-select-option"
                    onClick={() => {
                      setInternalValue(option.value);
                      onChange?.(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className="app-select-check" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3.5 8.5L6.5 11.5L12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="app-select-empty">{resolvedEmptyLabel}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
