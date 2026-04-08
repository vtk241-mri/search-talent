"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createLocalePath,
  getLocaleFromPathname,
  switchLocalePathname,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function useCurrentLocale(): Locale {
  return getLocaleFromPathname(usePathname());
}

export function useDictionary() {
  return getDictionary(useCurrentLocale());
}

export function useLocalizedHref(href: string, locale?: Locale) {
  const currentLocale = useCurrentLocale();

  return createLocalePath(locale ?? currentLocale, href);
}

export function useLocalizedRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  return {
    locale,
    pathname,
    push: (href: string) => router.push(createLocalePath(locale, href)),
    replace: (href: string) => router.replace(createLocalePath(locale, href)),
    refresh: () => router.refresh(),
    switchLocale: (targetLocale: Locale) =>
      router.push(switchLocalePathname(pathname, targetLocale)),
  };
}
