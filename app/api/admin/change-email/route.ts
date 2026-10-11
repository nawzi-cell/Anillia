import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { requireAdmin, toUserDTO } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { adminChangeEmailSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin profile action: change the administrator email address.
 * Requires:
 * 1. Admin session (requireAdmin)
 * 2. Current password verification
 * 3. New email is validated and not taken by any existing account
 * 4. Logs audit trail
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = adminChangeEmailSchema.parse(await req.json());

    if (body.newEmail === admin.email) {
      return fail("The new email is the same as your current email.", 400);
    }

    const currentRecord = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { passwordHash: true, email: true },
    });

    if (!currentRecord || !(await verifyPassword(body.currentPassword, currentRecord.passwordHash))) {
      return fail("Current password is incorrect.", 401);
    }

    const emailInUse = await prisma.user.findUnique({
      where: { email: body.newEmail },
      select: { id: true },
    });

    if (emailInUse) {
      return fail("An account with this email address already exists.", 409);
    }

    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { email: body.newEmail },
    });

    await logAudit({
      userId: admin.id,
      action: "admin.email.changed",
      entity: "User",
      entityId: admin.id,
      metadata: {
        previousEmail: currentRecord.email,
        newEmail: body.newEmail,
      },
      ip: getClientIp(req),
    });

    return ok(toUserDTO(updated));
  } catch (e) {
    return handleApiError(e);
  }
}
