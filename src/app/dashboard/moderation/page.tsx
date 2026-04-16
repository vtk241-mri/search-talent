import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminFeedbackEntry from "@/components/admin-feedback-entry";
import AdminModerationActions from "@/components/admin-moderation-actions";
import { buttonStyles } from "@/components/ui/button-styles";
import { getFeedbackEntries } from "@/lib/db/feedback";
import { getModerationQueue } from "@/lib/db/moderation";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getModerationCopy } from "@/lib/moderation-copy";
import { getCurrentViewerRole } from "@/lib/moderation-server";
import { buildMetadata } from "@/lib/seo";

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getResolvedLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(localeCookieName)?.value;

  return candidate && isLocale(candidate) ? candidate : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getResolvedLocale();
  const copy = getModerationCopy(locale);

  return buildMetadata({
    locale,
    pathname: "/dashboard/moderation",
    title: copy.dashboard.title,
    description: copy.dashboard.description,
  });
}

export default async function DashboardModerationPage() {
  const locale = await getResolvedLocale();
  const dictionary = getDictionary(locale);
  const copy = getModerationCopy(locale);
  const viewer = await getCurrentViewerRole();

  if (!viewer.user) {
    redirect("/login");
  }

  if (!viewer.isAdmin) {
    redirect("/dashboard");
  }

  const [queue, feedbackEntries] = await Promise.all([
    getModerationQueue(),
    getFeedbackEntries(),
  ]);

  if (!queue) {
    return null;
  }

  const feedbackCopy =
    locale === "uk"
      ? {
          heading: "Відгуки користувачів",
          description:
            "Повідомлення, які надходять із форми зворотного зв'язку. Після розгляду можна прибрати запис.",
          empty: "Ще немає нових відгуків.",
          anonymous: "Анонім",
          from: "Від",
          email: "Email",
          submittedAt: "Надіслано",
          openProfile: "Відкрити профіль",
          dismiss: "Прибрати",
          dismissing: "Видалення...",
          confirmTitle: "Прибрати відгук?",
          confirmMessage:
            "Запис буде видалений з системи. Дію не можна скасувати.",
          confirmButton: "Прибрати",
          cancel: "Скасувати",
          errorFallback: "Не вдалося прибрати відгук.",
          categoryLabels: {
            idea: "Ідея",
            bug: "Баг",
            feedback: "Відгук",
            complaint: "Скарга",
          } as Record<string, string>,
        }
      : {
          heading: "User feedback",
          description:
            "Messages submitted through the feedback form. Dismiss an entry once it's been handled.",
          empty: "No new feedback yet.",
          anonymous: "Anonymous",
          from: "From",
          email: "Email",
          submittedAt: "Submitted",
          openProfile: "Open profile",
          dismiss: "Dismiss",
          dismissing: "Removing...",
          confirmTitle: "Dismiss feedback?",
          confirmMessage:
            "This entry will be removed from the system. This action cannot be undone.",
          confirmButton: "Dismiss",
          cancel: "Cancel",
          errorFallback: "Could not dismiss the feedback entry.",
          categoryLabels: {
            idea: "Idea",
            bug: "Bug",
            feedback: "Feedback",
            complaint: "Complaint",
          } as Record<string, string>,
        };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] app-card p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] app-soft">
              {copy.dashboard.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {copy.dashboard.title}
            </h1>
            <p className="mt-3 max-w-3xl app-muted">{copy.dashboard.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>
              {dictionary.nav.dashboard}
            </Link>
            <Link href="/projects" className={buttonStyles({ variant: "ghost" })}>
              {dictionary.nav.projects}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: copy.dashboard.reportsCount, value: queue.summary.active },
            { label: copy.dashboard.urgentCount, value: queue.summary.urgent },
            { label: copy.dashboard.profilesCount, value: queue.summary.profiles },
            { label: copy.dashboard.projectsCount, value: queue.summary.projects },
          ].map((item) => (
            <article key={item.label} className="rounded-[1.5rem] app-panel p-5">
              <p className="text-sm app-soft">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </section>

      {queue.items.length === 0 ? (
        <section className="mt-8 rounded-[2rem] app-panel-dashed p-8 text-center">
          <p className="text-sm app-muted">{copy.dashboard.empty}</p>
        </section>
      ) : (
        <section className="mt-8 space-y-5">
          {queue.items.map((item) => (
            <article key={item.id} className="rounded-[2rem] app-card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] app-soft">
                    <span>{copy.targetLabels[item.targetType]}</span>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1">
                      {copy.priorityLabels[item.priority]}
                    </span>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1">
                      {copy.reportStatusLabels[item.reportStatus]}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold text-[color:var(--foreground)]">
                    {item.targetLabel}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm app-muted">
                    <span>
                      {copy.dashboard.reportReason}: {copy.reasonLabels[item.reportReason]}
                    </span>
                    <span>
                      {copy.dashboard.targetStatus}:{" "}
                      {item.targetStatus
                        ? copy.statusLabels[item.targetStatus]
                        : copy.statusLabels.approved}
                    </span>
                    <span>
                      {copy.dashboard.createdAt}: {formatDate(item.createdAt, locale)}
                    </span>
                  </div>

                  {item.details && (
                    <div className="mt-4 rounded-[1.5rem] app-panel p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] app-soft">
                        {copy.dashboard.reportDetails}
                      </p>
                      <p className="mt-3 text-sm leading-7 app-muted">{item.details}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm app-muted">
                    <span>
                      {copy.dashboard.reporter}: {item.reporterLabel}
                    </span>
                    <span>
                      {copy.dashboard.targetOwner}: {item.ownerLabel}
                    </span>
                  </div>

                  {item.targetHref && (
                    <div className="mt-4">
                      <Link
                        href={item.targetHref}
                        className="text-sm font-medium text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                      >
                        {copy.dashboard.openTarget}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="w-full lg:max-w-xl">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] app-soft">
                    {copy.dashboard.reviewActions}
                  </p>
                  <AdminModerationActions
                    copy={copy}
                    targetType={item.targetType}
                    targetId={item.targetId}
                    currentStatus={item.targetStatus}
                    reportId={item.id}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="mt-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            {feedbackCopy.heading}
          </h2>
          <p className="text-sm app-muted">{feedbackCopy.description}</p>
        </div>

        {feedbackEntries && feedbackEntries.length > 0 ? (
          <div className="mt-6 space-y-4">
            {feedbackEntries.map((entry) => (
              <AdminFeedbackEntry
                key={entry.id}
                id={entry.id}
                category={entry.category}
                categoryLabel={
                  feedbackCopy.categoryLabels[entry.category] || entry.category
                }
                message={entry.message}
                createdAtLabel={formatDate(entry.createdAt, locale)}
                name={entry.name}
                email={entry.email}
                authorUsername={entry.authorUsername}
                authorDisplayName={entry.authorDisplayName}
                profileHref={
                  entry.authorUsername ? `/u/${entry.authorUsername}` : null
                }
                copy={{
                  anonymous: feedbackCopy.anonymous,
                  from: feedbackCopy.from,
                  email: feedbackCopy.email,
                  category: feedbackCopy.categoryLabels[entry.category] || entry.category,
                  submittedAt: feedbackCopy.submittedAt,
                  openProfile: feedbackCopy.openProfile,
                  dismiss: feedbackCopy.dismiss,
                  dismissing: feedbackCopy.dismissing,
                  confirmTitle: feedbackCopy.confirmTitle,
                  confirmMessage: feedbackCopy.confirmMessage,
                  confirmButton: feedbackCopy.confirmButton,
                  cancel: feedbackCopy.cancel,
                  errorFallback: feedbackCopy.errorFallback,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[2rem] app-panel-dashed p-8 text-center">
            <p className="text-sm app-muted">{feedbackCopy.empty}</p>
          </div>
        )}
      </section>
    </main>
  );
}
