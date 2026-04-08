"use client";

import { useState } from "react";
import {
  buildAuthRedirectUrl,
  getAuthErrorMessage,
  getAuthFieldErrors,
  getPublicAuthErrorMessage,
  loginSchema,
  type AuthFieldErrors,
} from "@/lib/auth/validation";
import { useDictionary, useLocalizedRouter } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import LocalizedLink from "@/components/ui/localized-link";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function LoginPage() {
  const supabase = createClient();
  const router = useLocalizedRouter();
  const dictionary = useDictionary();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({
      email,
      password,
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

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    setLoading(false);

    if (loginError) {
      setError(getPublicAuthErrorMessage("login", dictionary));
      return;
    }

    router.push("/dashboard");
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildAuthRedirectUrl(
          router.locale,
          "/dashboard",
          process.env.NEXT_PUBLIC_APP_URL,
        ),
      },
    });

    setLoading(false);

    if (oauthError) {
      setError(getPublicAuthErrorMessage("oauth", dictionary));
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-[2rem] app-card p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] app-soft">
            {dictionary.auth.login.eyebrow}
          </p>
          <ButtonLink href="/" variant="ghost" size="sm">
            {dictionary.auth.home}
          </ButtonLink>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {dictionary.auth.login.title}
        </h1>

        <p className="mt-3 app-muted">{dictionary.auth.login.description}</p>

        <form
          onSubmit={handleLogin}
          noValidate
          className="mt-8 flex flex-col gap-4"
        >
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
          {fieldErrors.email && (
            <p className="text-sm text-red-500">{fieldErrors.email}</p>
          )}

          <input
            type="password"
            placeholder={dictionary.auth.password}
            className="rounded-2xl border app-border bg-[color:var(--surface)] p-3 text-[color:var(--foreground)]"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
              setFieldErrors((current) => ({
                ...current,
                password: undefined,
              }));
            }}
            autoComplete="current-password"
            maxLength={72}
            aria-label={dictionary.auth.password}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <p className="text-sm text-red-500">{fieldErrors.password}</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} className="justify-center">
            {loading
              ? dictionary.auth.login.loading
              : dictionary.auth.login.submit}
          </Button>

          <div className="mt-4 flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              variant="secondary"
              className="justify-center"
              disabled={loading}
            >
              {dictionary.auth.login.google}
            </Button>

            <Button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              variant="secondary"
              className="justify-center"
              disabled={loading}
            >
              {dictionary.auth.login.github}
            </Button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm app-muted">
          <LocalizedLink
            href="/signup"
            className="hover:text-[color:var(--foreground)]"
          >
            {dictionary.auth.login.createAccount}
          </LocalizedLink>
          <LocalizedLink
            href="/talents"
            className="hover:text-[color:var(--foreground)]"
          >
            {dictionary.auth.login.exploreFirst}
          </LocalizedLink>
        </div>
      </section>
    </main>
  );
}
