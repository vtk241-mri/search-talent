"use client";

import { useEffect, useState } from "react";
import {
  allowsCookieCategory,
  cookieConsentUpdatedEvent,
  getCookieConsentFromDocument,
} from "@/lib/cookie-consent";
import { useDictionary } from "@/lib/i18n/client";
import type { Theme } from "@/lib/theme";
import {
  applyThemeToDocument,
  clearThemePreferencePersistence,
  persistThemePreference,
} from "@/lib/theme-client";

type ResolvedTheme = "light" | "dark";

function canPersistThemePreference() {
  return allowsCookieCategory(getCookieConsentFromDocument(), "preferences");
}

export default function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const dictionary = useDictionary();
  const [theme, setTheme] = useState<ResolvedTheme>(initialTheme);
  const [canPersist, setCanPersist] = useState(false);

  useEffect(() => {
    setCanPersist(canPersistThemePreference());
  }, []);

  useEffect(() => {
    const handleConsentUpdate = () => {
      setCanPersist(canPersistThemePreference());
    };

    window.addEventListener(
      cookieConsentUpdatedEvent,
      handleConsentUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        cookieConsentUpdatedEvent,
        handleConsentUpdate as EventListener,
      );
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
        {(["light", "dark"] as const).map((item) => {
          const active = theme === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setTheme(item);
                applyThemeToDocument(item);

                if (canPersist) {
                  persistThemePreference(item);
                } else {
                  clearThemePreferencePersistence();
                }
              }}
              className={[
                "rounded-full px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
              ].join(" ")}
              aria-label={`${dictionary.theme.toggleLabel}: ${dictionary.theme[item]}`}
            >
              {dictionary.theme[item]}
            </button>
          );
        })}
      </div>

      {!canPersist && (
        <p className="max-w-xs text-xs leading-5 app-muted">
          {dictionary.cookieConsent.themeSessionOnly}
        </p>
      )}
    </div>
  );
}
