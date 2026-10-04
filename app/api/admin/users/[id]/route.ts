import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const roleUpdateSchema = z.object({
  role: z.enum(["ADMIN", "CUSTOMER"]),
});

/**
 * Admin: promote a user to ADMIN or demote back to CUSTOMER.
 *
 * Guards:
 * - you cannot change your own role (prevents accidental lockout),
 * - you cannot demote the last remaining admin.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = roleUpdateSchema.parse(await req.json());

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!target) return fail("User not found.", 404);

    if (target.id === admin.id) {
      return fail("You cannot change your own role.", 403);
    }

    if (target.role === body.role) {
      return ok({ id: target.id, role: target.role });
    }

    if (target.role === "ADMIN" && body.role === "CUSTOMER") {
      const remainingAdmins = await prisma.user.count({
        where: { role: "ADMIN", id: { not: target.id } },
      });
      if (remainingAdmins === 0) {
        return fail(
          "You cannot demote the last remaining admin. Promote someone else first.",
          409,
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role: body.role },
      select: { id: true, name: true, email: true, role: true },
    });

    await logAudit({
      userId: admin.id,
      action:
        body.role === "ADMIN" ? "admin.user.promoted" : "admin.user.demoted",
      entity: "User",
      entityId: target.id,
      metadata: {
        email: target.email,
        from: target.role,
        to: body.role,
      },
      ip: getClientIp(req),
    });

    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
