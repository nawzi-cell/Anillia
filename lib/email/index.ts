import nodemailer, { type Transporter } from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

/** True when SMTP delivery is configured (not just a console fallback). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

/**
 * Send a transactional email when SMTP is configured. Without SMTP the
 * message is logged in non-production so local flows remain testable.
 * NEVER throws: checkout and password flows must not fail because email is
 * unavailable.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<{ queued: boolean }> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email:dev] to=${input.to} subject=${input.subject}\n${input.text ?? input.html}`
      );
    } else {
      console.error(
        `[email] SMTP is not configured; dropped "${input.subject}"`
      );
    }
    return { queued: false };
  }

  try {
    await getTransporter().sendMail({
      from:
        process.env.SMTP_FROM?.trim() ||
        process.env.SMTP_USER?.trim() ||
        "no-reply@anilliea.pk",
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { queued: true };
  } catch (err) {
    // Log the error class only; recipients and message bodies are PII.
    console.error(
      `[email] delivery failed for "${input.subject}":`,
      err instanceof Error ? err.name : "unknown error"
    );
    return { queued: false };
  }
}
