import type { Dictionary } from "@/lib/i18n/dictionaries";
import CookieSettingsButton from "@/components/cookie-settings-button";
import LocalizedLink from "@/components/ui/localized-link";
import Image from "next/image";
import logoImage from "../../public/logo.webp";

type SiteFooterProps = {
  dictionary: Dictionary;
  isSignedIn: boolean;
};

export default function SiteFooter({
  dictionary,
  isSignedIn,
}: SiteFooterProps) {
  const talentsLabel =
    dictionary.nav.search === "Search" ? "Talents" : "Таланти";

  const articlesLabel =
    dictionary.nav.search === "Search" ? "Articles" : "Статті";

  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-4 text-sm text-[color:var(--muted-foreground)] sm:px-6">
        <div className="flex gap-6">
          <LocalizedLink
            href="/"
            className="relative block h-10 w-[124px] shrink-0"
          >
            <Image
              src={logoImage}
              alt={dictionary.site.name}
              fill
              priority
              sizes="124px"
              className="object-contain object-left"
            />
          </LocalizedLink>
          {/* <p className="mt-1 max-w-xl">{dictionary.footer.description}</p> */}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-wrap gap-4">
            <LocalizedLink
              href="/"
              className="hover:text-[color:var(--foreground)]"
            >
              {dictionary.nav.home}
            </LocalizedLink>
            <LocalizedLink
              href="/projects"
              className="hover:text-[color:var(--foreground)]"
            >
              {dictionary.nav.projects}
            </LocalizedLink>
            <LocalizedLink
              href="/talents"
              className="hover:text-[color:var(--foreground)]"
            >
              {talentsLabel}
            </LocalizedLink>
            <LocalizedLink
              href="/articles"
              className="hover:text-[color:var(--foreground)]"
            >
              {articlesLabel}
            </LocalizedLink>
            <LocalizedLink
              href={isSignedIn ? "/dashboard" : "/login"}
              className="hover:text-[color:var(--foreground)]"
            >
              {isSignedIn ? dictionary.nav.dashboard : dictionary.nav.login}
            </LocalizedLink>
            {!isSignedIn && (
              <LocalizedLink
                href="/signup"
                className="hover:text-[color:var(--foreground)]"
              >
                {dictionary.nav.signup}
              </LocalizedLink>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] app-soft">
              {dictionary.footer.legal}
            </span>
            <LocalizedLink
              href="/terms"
              className="hover:text-[color:var(--foreground)]"
            >
              {dictionary.footer.terms}
            </LocalizedLink>
            <LocalizedLink
              href="/privacy"
              className="hover:text-[color:var(--foreground)]"
            >
              {dictionary.footer.privacy}
            </LocalizedLink>
            <LocalizedLink
              href="/cookies"
              className="hover:text-[color:var(--foreground)]"
            >
              {dictionary.footer.cookies}
            </LocalizedLink>
            <CookieSettingsButton
              label={dictionary.footer.manageCookies}
              className="hover:text-[color:var(--foreground)]"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
