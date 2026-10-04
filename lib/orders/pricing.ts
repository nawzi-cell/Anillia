import { calculateDiscount, type CouponLike } from "@/lib/coupons/engine";

/**
 * Server-side order pricing (whole PKR integers).
 * NEVER trust client-provided prices/totals — always recompute here.
 */

export const STANDARD_DELIVERY_FEE = 250;
export const EXPRESS_DELIVERY_FEE = 450;
export const FREE_DELIVERY_THRESHOLD = 5000;

export interface PricingItem {
  price: number;
  quantity: number;
}

export interface PricingInput {
  items: PricingItem[];
  coupon?: CouponLike | null;
  deliveryMethod: "STANDARD" | "EXPRESS";
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

/**
 * Calculate order totals.
 * - STANDARD delivery: 250 PKR, FREE when (subtotal - discount) >= 5000
 * - EXPRESS delivery: 450 PKR
 * - total = subtotal - discount + delivery
 */
export function calculateTotals(input: PricingInput): PricingResult {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = input.coupon
    ? calculateDiscount(input.coupon, subtotal)
    : 0;
  const afterDiscount = subtotal - discount;
  const delivery =
    input.deliveryMethod === "EXPRESS"
      ? EXPRESS_DELIVERY_FEE
      : afterDiscount >= FREE_DELIVERY_THRESHOLD
        ? 0
        : STANDARD_DELIVERY_FEE;

  return {
    subtotal,
    discount,
    delivery,
    total: afterDiscount + delivery,
  };
}
