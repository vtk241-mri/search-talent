"use client";

import { useState } from "react";
import {
  buildAuthRedirectUrl,
  getAuthErrorMessage,
  getAuthFieldErrors,
  getPublicAuthErrorMessage,
  signupSchema,
  type AuthFieldErrors,
} from "@/lib/auth/validation";
import { useDictionary, useLocalizedHref, useLocalizedRouter } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import LocalizedLink from "@/components/ui/localized-link";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function SignupPage() {
  const supabase = createClient();
  const router = useLocalizedRouter();
  const dictionary = useDictionary();
  const verifyHref = useLocalizedHref("/verify");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextFieldErrors = getAuthFieldErrors(parsed.error);
      const localizedFieldErrors = Object.fromEntries(
        Object.entries(nextFieldErrors).map(([field, code]) => [
          field,
          getAuthErrorMessage(code || "generic", dictionary),
        ]),
      ) as AuthFieldErrors;

      setFieldErrors(localizedFieldErrors);
      setLoading(false);
      return;
    }

    const { error: signupError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: buildAuthRedirectUrl(
          router.locale,
          "/verify",
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      },
    });

    setLoading(false);

    if (signupError) {
      setError(getPublicAuthErrorMessage("signup", dictionary));
      return;
    }

    window.location.assign(verifyHref);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-[2rem] app-card p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] app-soft">
            {dictionary.auth.signup.eyebrow}
          </p>
          <ButtonLink href="/" variant="ghost" size="sm">
            {dictionary.auth.home}
          </ButtonLink>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {dictionary.auth.signup.title}
        </h1>

        <p className="mt-3 app-muted">
          {dictionary.auth.signup.description}
        </p>

        <form onSubmit={handleSignup} noValidate className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder={dictionary.auth.email}
            className="rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            maxLength={254}
            aria-label={dictionary.auth.email}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}

          <input
            type="password"
            placeholder={dictionary.auth.password}
            className="rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            autoComplete="new-password"
            maxLength={72}
            aria-label={dictionary.auth.password}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}

          <p className="text-sm app-muted">{dictionary.auth.passwordHint}</p>

          <input
            type="password"
            placeholder={dictionary.auth.confirmPassword}
            className="rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
            }}
            autoComplete="new-password"
            maxLength={72}
            aria-label={dictionary.auth.confirmPassword}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} className="justify-center">
            {loading ? dictionary.auth.signup.loading : dictionary.auth.signup.submit}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm app-muted">
          <LocalizedLink href="/login" className="hover:text-[color:var(--foreground)]">
            {dictionary.auth.signup.alreadyHaveAccount}
          </LocalizedLink>
          <LocalizedLink href="/projects" className="hover:text-[color:var(--foreground)]">
            {dictionary.auth.signup.browseProjects}
          </LocalizedLink>
        </div>
      </section>
    </main>
  );
}
