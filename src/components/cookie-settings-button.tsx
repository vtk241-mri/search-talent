"use client";

import { requestCookieConsentPreferences } from "@/lib/cookie-consent";

type CookieSettingsButtonProps = {
  label: string;
  className?: string;
};

export default function CookieSettingsButton({
  label,
  className = "",
}: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => requestCookieConsentPreferences()}
      className={className}
    >
      {label}
    </button>
  );
}

