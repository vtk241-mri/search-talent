import { escapeHtml } from "@/lib/email/resend";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type FollowerEmailInput = {
  recipientName: string;
  followerName: string;
  followerUsername: string | null;
  followerHeadline: string | null;
  profileUrl: string;
  unsubscribeUrl?: string;
  locale: Locale;
};

export function buildNewFollowerEmail(input: FollowerEmailInput) {
  const dictionary = getDictionary(input.locale);
  const email = dictionary.emails.newFollower;

  const safeRecipient = escapeHtml(input.recipientName || "");
  const safeFollower = escapeHtml(input.followerName || "");
  const safeHandle = input.followerUsername
    ? `@${escapeHtml(input.followerUsername)}`
    : "";
  const safeHeadline = input.followerHeadline
    ? escapeHtml(input.followerHeadline)
    : "";
  const safeUrl = escapeHtml(input.profileUrl);

  const greeting = email.greeting.replace("{name}", safeRecipient);
  const intro = email.intro
    .replace("{follower}", safeFollower)
    .replace("{handle}", safeHandle);

  const subject = email.subject.replace("{follower}", input.followerName);

  const html = `<!doctype html>
<html lang="${input.locale}">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f7f9; margin: 0; padding: 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <tr>
        <td style="padding: 32px 32px 16px 32px;">
          <h1 style="margin: 0 0 16px 0; font-size: 20px; color: #111;">${greeting}</h1>
          <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #333;">${intro}</p>
          ${safeHeadline ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #555; font-style: italic;">${safeHeadline}</p>` : ""}
          <p style="margin: 24px 0;">
            <a href="${safeUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 600;">${escapeHtml(email.cta)}</a>
          </p>
          <p style="margin: 24px 0 0 0; font-size: 13px; color: #888; line-height: 1.5;">${escapeHtml(email.signature)}</p>
        </td>
      </tr>
      ${
        input.unsubscribeUrl
          ? `<tr>
        <td style="padding: 16px 32px; background: #fafafa; border-top: 1px solid #eee; font-size: 12px; color: #888;">
          <a href="${escapeHtml(input.unsubscribeUrl)}" style="color: #888;">${escapeHtml(email.manageNotifications)}</a>
        </td>
      </tr>`
          : ""
      }
    </table>
  </body>
</html>`;

  const text = [
    `${input.recipientName ? `${dictionary.emails.newFollower.greeting.replace("{name}", input.recipientName)}` : ""}`,
    `${input.followerName} ${input.followerUsername ? `(@${input.followerUsername}) ` : ""}${email.intro.replace("{follower}", "").replace("{handle}", "").trim()}`,
    input.followerHeadline || "",
    "",
    `${email.cta}: ${input.profileUrl}`,
    "",
    email.signature,
    input.unsubscribeUrl ? `\n${email.manageNotifications}: ${input.unsubscribeUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
