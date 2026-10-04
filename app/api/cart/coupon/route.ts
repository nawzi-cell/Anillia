import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { couponCodeSchema } from "@/lib/validation/schemas";
import { validateCoupon, type CouponLike } from "@/lib/coupons/engine";
import { getCartWithTotals } from "@/lib/cart/cart";
import type { Coupon } from "@prisma/client";

function toCouponLike(coupon: Coupon): CouponLike {
  return {
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
  };
}

/**
 * Auth: apply a coupon to the cart. The code is validated against the
 * current server-computed subtotal before being stored.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = couponCodeSchema.parse(await req.json());
    const code = body.code.trim().toUpperCase();

    const cart = await getCartWithTotals(user.id);
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    const check = validateCoupon(
      coupon ? toCouponLike(coupon) : null,
      cart.subtotal
    );
    if (!check.valid) {
      return fail(check.message ?? "Coupon is not valid.", 400);
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: code },
    });

    const updated = await getCartWithTotals(user.id);
    return ok({
      code,
      discount: check.discount,
      cart: updated,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

/** Auth: remove the applied coupon from the cart. */
export async function DELETE(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const cart = await getCartWithTotals(user.id);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });
    return ok(await getCartWithTotals(user.id));
  } catch (e) {
    return handleApiError(e);
  }
}
