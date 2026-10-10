import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GENERIC_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`auth:forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return fail("Too many requests. Please try again later.", 429);
    }

    const body = forgotPasswordSchema.parse(await req.json());

    // No enumeration: always return 200 with a generic message.
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpires: expires },
      });

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your ANILLIÉA password",
        text: `Hi ${user.name},\n\nUse the link below to reset your password. It expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
        html: `<p>Hi ${user.name},</p><p>Use the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetLink}">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    }

    return ok({ message: GENERIC_MESSAGE });
  } catch (e) {
    return handleApiError(e);
  }
}
