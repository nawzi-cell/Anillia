import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import { hashToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rl = rateLimit(`auth:reset:${getClientIp(req)}`, 10, 60 * 60 * 1000);
    if (!rl.ok) return fail("Too many requests. Please try again later.", 429);

    const body = resetPasswordSchema.parse(await req.json());

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashToken(body.token.trim()),
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return fail("This reset link is invalid or has expired.", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(body.password),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return ok({ message: "Password has been reset. You can now log in." });
  } catch (e) {
    return handleApiError(e);
  }
}
