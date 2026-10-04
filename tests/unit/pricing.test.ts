/**
 * Unit tests for ../../lib/orders/pricing
 * (order totals owned by the backend engineer)
 *
 * Contract:
 *   calculateTotals(input: {
 *     items: Array<{ price: number; quantity: number }>;
 *     coupon?: CouponLike | null;
 *     deliveryMethod: "STANDARD" | "EXPRESS";
 *   }): { subtotal: number; discount: number; delivery: number; total: number }
 *
 * Business rules:
 *   - subtotal = Σ price × quantity
 *   - discount computed from the coupon (server-side coupon engine)
 *   - total = subtotal - discount + delivery
 *   - STANDARD delivery = 250, free when (subtotal - discount) >= 5000
 *   - EXPRESS delivery = 450 (no free threshold)
 *   - all amounts are whole-PKR integers
 */
import { describe, it, expect } from "vitest";
import { calculateTotals } from "../../lib/orders/pricing";
import type { CouponLike } from "../../lib/coupons/engine";

const ITEMS = [
  { price: 1450, quantity: 2 }, // 2900
  { price: 650, quantity: 1 }, //  650
]; // subtotal = 3550

function fixedCoupon(value: number): CouponLike {
  const now = new Date();
  return {
    code: "TEST",
    type: "FIXED_AMOUNT",
    value,
    minimumOrderAmount: 0,
    maximumDiscount: null,
    usageLimit: null,
    usedCount: 0,
    startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    expiryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    active: true,
  };
}

describe("calculateTotals", () => {
  it("sums the subtotal across items", () => {
    const result = calculateTotals({ items: ITEMS, deliveryMethod: "STANDARD" });
    expect(result.subtotal).toBe(3550);
    expect(result.discount).toBe(0);
  });

  it("applies the coupon discount and computes total = subtotal - discount + delivery", () => {
    const result = calculateTotals({
      items: ITEMS,
      coupon: fixedCoupon(355),
      deliveryMethod: "STANDARD",
    });
    expect(result.discount).toBe(355);
    expect(result.delivery).toBe(250); // 3550 - 355 = 3195 < 5000
    expect(result.total).toBe(3550 - 355 + 250);
  });

  it("charges 250 for STANDARD delivery", () => {
    const result = calculateTotals({ items: ITEMS, deliveryMethod: "STANDARD" });
    expect(result.delivery).toBe(250);
    expect(result.total).toBe(3550 + 250);
  });

  it("gives free STANDARD delivery when the discounted subtotal is >= 5000", () => {
    const result = calculateTotals({
      items: [{ price: 3499, quantity: 2 }], // 6998
      coupon: fixedCoupon(1000), // 5998 after discount
      deliveryMethod: "STANDARD",
    });
    expect(result.delivery).toBe(0);
    expect(result.total).toBe(5998);
  });

  it("charges STANDARD delivery just below the free threshold", () => {
    const result = calculateTotals({
      items: [{ price: 5000, quantity: 1 }],
      coupon: fixedCoupon(1), // 4999 after discount
      deliveryMethod: "STANDARD",
    });
    expect(result.delivery).toBe(250);
  });

  it("charges 450 for EXPRESS delivery (no free threshold)", () => {
    const result = calculateTotals({
      items: [{ price: 3499, quantity: 2 }],
      deliveryMethod: "EXPRESS",
    });
    expect(result.delivery).toBe(450);
    expect(result.total).toBe(6998 + 450);
  });

  it("returns whole-PKR integers for every amount", () => {
    const result = calculateTotals({
      items: [{ price: 899, quantity: 3 }],
      coupon: fixedCoupon(90),
      deliveryMethod: "EXPRESS",
    });
    for (const amount of [
      result.subtotal,
      result.discount,
      result.delivery,
      result.total,
    ]) {
      expect(Number.isInteger(amount)).toBe(true);
    }
  });

  it("handles an empty cart", () => {
    const result = calculateTotals({ items: [], deliveryMethod: "STANDARD" });
    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.delivery).toBe(250);
    expect(result.total).toBe(250);
  });
});
