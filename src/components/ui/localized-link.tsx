"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useCurrentLocale } from "@/lib/i18n/client";
import { createLocalePath } from "@/lib/i18n/config";

type LocalizedLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children: ReactNode;
  };

export default function LocalizedLink({
  children,
  href,
  ...props
}: LocalizedLinkProps) {
  const locale = useCurrentLocale();
  const localizedHref =
    typeof href === "string" ? createLocalePath(locale, href) : href;

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
