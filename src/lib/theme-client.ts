export const themeCookieName = "theme";

function buildClientCookieAttributes(maxAge: number) {
  if (typeof window === "undefined") {
    return `path=/; max-age=${maxAge}; samesite=lax`;
  }

  return [
    "path=/",
    `max-age=${maxAge}`,
    "samesite=lax",
    window.location.protocol === "https:" ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function applyThemeToDocument(theme: "light" | "dark") {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function persistThemePreference(theme: "light" | "dark") {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${themeCookieName}=${encodeURIComponent(
    theme,
  )}; ${buildClientCookieAttributes(31536000)}`;
}

export function clearThemePreferencePersistence() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${themeCookieName}=; ${buildClientCookieAttributes(0)}`;
}

export function getThemeFromDocument() {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
