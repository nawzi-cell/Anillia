import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { couponSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const updateSchema = couponSchema.partial();

/** Admin: update a coupon. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Coupon not found.", 404);

    const body = updateSchema.parse(await req.json());

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.value !== undefined ? { value: body.value } : {}),
        ...(body.minimumOrderAmount !== undefined
          ? { minimumOrderAmount: body.minimumOrderAmount }
          : {}),
        ...(body.maximumDiscount !== undefined
          ? { maximumDiscount: body.maximumDiscount ?? null }
          : {}),
        ...(body.usageLimit !== undefined
          ? { usageLimit: body.usageLimit ?? null }
          : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.expiryDate !== undefined
          ? { expiryDate: body.expiryDate ?? null }
          : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });

    void logAudit({
      userId: admin.id,
      action: "coupon.update",
      entity: "Coupon",
      entityId: coupon.id,
      metadata: { code: coupon.code },
      ip: getClientIp(req),
    });

    return ok(coupon);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a coupon (blocked once it has been used). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
      select: { id: true, code: true, usedCount: true },
    });
    if (!existing) return fail("Coupon not found.", 404);

    if (existing.usedCount > 0) {
      return fail(
        "This coupon has been used and cannot be deleted. Deactivate it instead.",
        409
      );
    }

    await prisma.coupon.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "coupon.delete",
      entity: "Coupon",
      entityId: params.id,
      metadata: { code: existing.code },
      ip: getClientIp(req),
    });

    return ok({ message: "Coupon deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
