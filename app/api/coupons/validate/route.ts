import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { validateCoupon, type CouponLike } from "@/lib/coupons/engine";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import { fail } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const validateSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.number().int().min(0).optional(),
});

/**
 * Public: validate a coupon code and preview its discount.
 * (Checkout always re-validates server-side.)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rl = rateLimit(`coupon:validate:${getClientIp(req)}`, 30, 60_000);
    if (!rl.ok) return fail("Too many requests. Please try again later.", 429);

    const body = validateSchema.parse(await req.json());
    const code = body.code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    const like: CouponLike | null = coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minimumOrderAmount: coupon.minimumOrderAmount,
          maximumDiscount: coupon.maximumDiscount,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          startDate: coupon.startDate,
          expiryDate: coupon.expiryDate,
          active: coupon.active,
        }
      : null;

    const result = validateCoupon(like, body.subtotal ?? 0);
    return ok({
      valid: result.valid,
      discount: result.discount,
      message: result.message ?? null,
      code,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
