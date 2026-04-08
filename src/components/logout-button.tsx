"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useDictionary, useLocalizedHref } from "@/lib/i18n/client";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const supabase = createClient();
  const dictionary = useDictionary();
  const loginHref = useLocalizedHref("/login");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
      });
    } finally {
      window.location.assign(loginHref);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="secondary"
      size="sm"
      className={className}
    >
      {dictionary.nav.logout}
    </Button>
  );
}
