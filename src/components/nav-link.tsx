"use client";

import { usePathname } from "next/navigation";
import LocalizedLink from "@/components/ui/localized-link";
import { stripLocaleFromPathname } from "@/lib/i18n/config";

type NavLinkProps = {
  href: string;
  label: string;
  mobile?: boolean;
  onClick?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLink({
  href,
  label,
  mobile = false,
  onClick,
}: NavLinkProps) {
  const pathname = stripLocaleFromPathname(usePathname() || "/");
  const isActive = isActivePath(pathname, href);

  const baseClasses = mobile
    ? "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
    : "rounded-full px-3 py-2 text-sm font-medium transition-colors";

  const stateClasses = isActive
    ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
    : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]";

  return (
    <LocalizedLink
      href={href}
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
    >
      {label}
    </LocalizedLink>
  );
}
