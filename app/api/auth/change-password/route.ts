import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { changePasswordSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = changePasswordSchema.parse(await req.json());

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!record || !(await verifyPassword(body.currentPassword, record.passwordHash))) {
      return fail("Current password is incorrect.", 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });

    return ok({ message: "Password updated." });
  } catch (e) {
    return handleApiError(e);
  }
}
