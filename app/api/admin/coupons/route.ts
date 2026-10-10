import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { couponSchema, paginationSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Admin: list coupons, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const [total, coupons] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(coupons, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: create a coupon (code is stored uppercase). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = couponSchema.parse(await req.json());

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code,
        type: body.type,
        value: body.value,
        minimumOrderAmount: body.minimumOrderAmount,
        maximumDiscount: body.maximumDiscount ?? null,
        usageLimit: body.usageLimit ?? null,
        startDate: body.startDate ?? new Date(),
        expiryDate: body.expiryDate ?? null,
        active: body.active,
      },
    });

    void logAudit({
      userId: admin.id,
      action: "coupon.create",
      entity: "Coupon",
      entityId: coupon.id,
      metadata: { code: coupon.code, type: coupon.type, value: coupon.value },
      ip: getClientIp(req),
    });

    return ok(coupon, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
