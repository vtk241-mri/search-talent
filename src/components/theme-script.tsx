import { cookieConsentCookieName } from "@/lib/cookie-consent";
import { themeCookieName } from "@/lib/theme";

export default function ThemeScript() {
  const code = `
    (function() {
      try {
        var consentMatch = document.cookie.match(/(?:^|; )${cookieConsentCookieName}=([^;]+)/);
        var preferencesAllowed = false;
        if (consentMatch) {
          try {
            var consent = JSON.parse(decodeURIComponent(consentMatch[1]));
            preferencesAllowed = consent && consent.categories && consent.categories.preferences === true;
          } catch (error) {}
        }

        var theme = 'light';
        if (preferencesAllowed) {
          var themeMatch = document.cookie.match(/(?:^|; )${themeCookieName}=([^;]+)/);
          theme = themeMatch ? decodeURIComponent(themeMatch[1]) : 'light';
        }

        if (theme !== 'dark' && theme !== 'light') theme = 'light';
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (error) {}
    })();
  `;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
