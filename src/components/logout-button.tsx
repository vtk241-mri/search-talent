"use client";

import { Button } from "@/components/ui/Button";
import { useDictionary, useLocalizedRouter } from "@/lib/i18n/client";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useLocalizedRouter();
  const dictionary = useDictionary();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.refresh();
    router.push("/login");
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
