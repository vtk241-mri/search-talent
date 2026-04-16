"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import FormSelect from "@/components/ui/form-select";
import FormTextarea from "@/components/ui/form-textarea";
import { useDictionary } from "@/lib/i18n/client";

export default function FeedbackPage() {
  const dictionary = useDictionary();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("idea");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "idea", label: dictionary.feedbackPage.categoryIdea },
    { value: "bug", label: dictionary.feedbackPage.categoryBug },
    { value: "feedback", label: dictionary.feedbackPage.categoryFeedback },
    { value: "complaint", label: dictionary.feedbackPage.categoryComplaint },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setCategory("idea");
    setMessage("");
    setSent(false);
    setError(null);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <section className="rounded-[2.25rem] app-card p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] app-soft">
              {dictionary.feedbackPage.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {dictionary.feedbackPage.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 app-muted">
              {dictionary.feedbackPage.description}
            </p>
          </div>

          <ButtonLink href="/" variant="ghost" size="sm">
            {dictionary.feedbackPage.backToHome}
          </ButtonLink>
        </div>

        {sent ? (
          <div className="mt-8 rounded-[1.75rem] app-panel p-6 text-center">
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {dictionary.feedbackPage.successTitle}
            </h2>
            <p className="mt-3 app-muted">
              {dictionary.feedbackPage.successDescription}
            </p>
            <div className="mt-6">
              <Button variant="secondary" onClick={handleReset}>
                {dictionary.feedbackPage.sendAnother}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 flex flex-col gap-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  {dictionary.feedbackPage.nameLabel}
                </label>
                <input
                  type="text"
                  placeholder={dictionary.feedbackPage.namePlaceholder}
                  className="app-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  {dictionary.feedbackPage.emailLabel}
                </label>
                <input
                  type="email"
                  placeholder={dictionary.feedbackPage.emailPlaceholder}
                  className="app-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                {dictionary.feedbackPage.categoryLabel}
              </label>
              <FormSelect
                className="w-full"
                triggerClassName="w-full"
                value={category}
                onChange={(value) => setCategory(value)}
                options={categoryOptions}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                {dictionary.feedbackPage.messageLabel}
              </label>
              <FormTextarea
                placeholder={dictionary.feedbackPage.messagePlaceholder}
                className="min-h-36 p-4 text-[color:var(--foreground)]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="justify-center"
            >
              {loading
                ? dictionary.feedbackPage.sending
                : dictionary.feedbackPage.submit}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
