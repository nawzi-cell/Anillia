import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { toUserDTO } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`auth:login:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return fail("Too many requests. Please try again later.", 429);
    }

    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    // Generic message — never reveal whether the email exists.
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      // TEMP-DIAG (2026-10-03): trace sign-in bounce. Remove after diagnosis.
      console.log(`[auth-diag] sign-in rejected for "${body.email}" (bad credentials)`);
      return fail("Invalid email or password.", 401);
    }

    const token = signToken({ sub: user.id, role: user.role });
    const res = ok(toUserDTO(user));
    // TEMP-DIAG (2026-10-03): trace sign-in bounce. Remove after diagnosis.
    console.log(
      `[auth-diag] sign-in ok: ${user.email} role=${user.role} — setting session cookie`
    );
    return setSessionCookie(req, res, token);
  } catch (e) {
    return handleApiError(e);
  }
}
