"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import VerifiedBadge from "@/components/verified-badge";
import { useDictionary } from "@/lib/i18n/client";

export default function EmailVerificationButton({
  initialVerified,
}: {
  initialVerified: boolean;
}) {
  const dictionary = useDictionary();
  const [verified, setVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (verified) {
    return (
      <div className="flex items-center gap-2">
        <VerifiedBadge verified />
      </div>
    );
  }

  const handleVerify = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/email-verification", {
        method: "POST",
      });
      const data = await response.json();

      if (data.verified) {
        setVerified(true);
      } else {
        setMessage(dictionary.emailVerification.notConfirmed);
      }
    } catch {
      setMessage(dictionary.emailVerification.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={handleVerify} disabled={loading} variant="secondary" size="sm">
        {loading
          ? dictionary.emailVerification.checking
          : dictionary.emailVerification.verify}
      </Button>
      {message && <p className="text-sm app-muted">{message}</p>}
    </div>
  );
}
