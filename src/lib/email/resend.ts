/**
 * Minimal Resend client via the HTTP API. No SDK dependency.
 *
 * Usage:
 *   await sendEmail({ to, subject, html, text? });
 *
 * Environment variables:
 *   RESEND_API_KEY     — Resend API key (required for sending)
 *   RESEND_FROM_EMAIL  — sender address, e.g. "Search Talent <notifications@yourdomain.com>"
 *
 * Emails are sent best-effort from server routes. If env is not configured,
 * `sendEmail` returns false and logs a warning — never throws.
 */

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return resendConfig() !== null;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = resendConfig();

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[email] RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping send",
        { to: input.to, subject: input.subject },
      );
    }
    return { sent: false, error: "email_not_configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[email] Resend send failed", response.status, body);
      return { sent: false, error: `status_${response.status}` };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (error) {
    console.error("[email] Resend send threw", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

/**
 * Basic HTML escaping so user-supplied strings can be interpolated into
 * an email template without enabling injection of arbitrary markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
