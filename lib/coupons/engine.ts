/**
 * Coupon discount engine (pure functions — safe for unit tests).
 */

export interface CouponLike {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: Date;
  expiryDate: Date | null;
  active: boolean;
}

export interface CouponValidation {
  valid: boolean;
  message?: string;
  discount: number;
}

/**
 * Calculate the discount (whole PKR) for a coupon against a subtotal.
 * - PERCENTAGE: round(subtotal * value / 100), capped by maximumDiscount
 * - FIXED_AMOUNT: min(value, subtotal)
 * The discount never exceeds the subtotal.
 */
export function calculateDiscount(
  coupon: CouponLike,
  subtotal: number
): number {
  let discount =
    coupon.type === "PERCENTAGE"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maximumDiscount != null) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  return Math.max(0, Math.min(discount, subtotal));
}

/**
 * Validate a coupon against a subtotal. Checks: exists, active,
 * startDate <= now <= expiryDate, minimum order amount, usage limit.
 */
export function validateCoupon(
  coupon: CouponLike | null,
  subtotal: number
): CouponValidation {
  if (!coupon) {
    return { valid: false, message: "Coupon not found.", discount: 0 };
  }
  if (!coupon.active) {
    return { valid: false, message: "This coupon is not active.", discount: 0 };
  }
  const now = new Date();
  if (coupon.startDate.getTime() > now.getTime()) {
    return { valid: false, message: "This coupon is not active yet.", discount: 0 };
  }
  if (coupon.expiryDate && coupon.expiryDate.getTime() < now.getTime()) {
    return { valid: false, message: "This coupon has expired.", discount: 0 };
  }
  if (subtotal < coupon.minimumOrderAmount) {
    return {
      valid: false,
      message: `This coupon requires a minimum order of PKR ${coupon.minimumOrderAmount.toLocaleString("en-PK")}.`,
      discount: 0,
    };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      message: "This coupon has reached its usage limit.",
      discount: 0,
    };
  }
  return { valid: true, discount: calculateDiscount(coupon, subtotal) };
}
