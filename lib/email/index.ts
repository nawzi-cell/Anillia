/**
 * Email sending facade.
 *
 * - If SMTP_HOST is configured, we log the intent (a nodemailer provider
 *   can be wired in here later) and report queued: true.
 * - Otherwise we console-log the message in development.
 * - NEVER throws for missing SMTP: transactional email is best-effort and
 *   must not fail checkout or password flows.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ queued: boolean }> {
  try {
    const host = process.env.SMTP_HOST?.trim();
    if (host) {
      // Structured log point for a future nodemailer provider.
      console.log(
        JSON.stringify({
          channel: "email",
          action: "queue",
          host,
          to: input.to,
          subject: input.subject,
        })
      );
    } else {
      console.log(
        `[email:dev] to=${input.to} subject=${input.subject}\n${input.text ?? input.html}`
      );
    }
    return { queued: true };
  } catch (err) {
    console.error("[email] failed to queue message", err);
    return { queued: false };
  }
}
