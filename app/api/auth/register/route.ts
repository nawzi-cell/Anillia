import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { toUserDTO } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`auth:register:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return fail("Too many requests. Please try again later.", 429);
    }

    const body = registerSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (existing) {
      return fail("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: "CUSTOMER",
        },
      });
      await tx.cart.create({ data: { userId: created.id } });
      await tx.wishlist.create({ data: { userId: created.id } });
      return created;
    });

    const token = signToken({ sub: user.id, role: user.role });
    const res = ok(toUserDTO(user), 201);
    return setSessionCookie(req, res, token);
  } catch (e) {
    return handleApiError(e);
  }
}
