/**
 * Unit tests for ../../lib/coupons/engine
 * (coupon validation owned by the backend engineer)
 *
 * Contract assumed:
 *   validateCoupon(coupon: CouponLike | null, subtotal: number):
 *     { valid: boolean; discount: number; reason?: string }
 *
 * CouponLike mirrors the Prisma Coupon fields relevant to validation:
 * code, type ("PERCENTAGE" | "FIXED_AMOUNT"), value, minimumOrderAmount,
 * maximumDiscount (number | null), usageLimit (number | null), usedCount,
 * startDate, expiryDate (Date | null), active.
 */
import { describe, it, expect } from "vitest";
import { validateCoupon } from "../../lib/coupons/engine";

interface CouponLike {
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

function makeCoupon(overrides: Partial<CouponLike> = {}): CouponLike {
  const now = new Date();
  return {
    code: "TEST10",
    type: "PERCENTAGE",
    value: 10,
    minimumOrderAmount: 0,
    maximumDiscount: null,
    usageLimit: null,
    usedCount: 0,
    startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
    expiryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
    active: true,
    ...overrides,
  };
}

describe("validateCoupon — discount math", () => {
  it("computes PERCENTAGE discounts", () => {
    const result = validateCoupon(makeCoupon({ value: 10 }), 2000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(200);
  });

  it("caps PERCENTAGE discounts at maximumDiscount", () => {
    const result = validateCoupon(
      makeCoupon({ value: 20, maximumDiscount: 2000 }),
      20000
    );
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(2000); // 20% of 20000 = 4000, capped
  });

  it("caps FIXED_AMOUNT discounts at the subtotal", () => {
    const result = validateCoupon(
      makeCoupon({ type: "FIXED_AMOUNT", value: 500 }),
      300
    );
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(300);
  });

  it("returns whole-PKR integer discounts", () => {
    const result = validateCoupon(makeCoupon({ value: 10 }), 1999);
    expect(result.valid).toBe(true);
    expect(Number.isInteger(result.discount)).toBe(true);
    expect(result.discount).toBeLessThanOrEqual(200);
  });
});

describe("validateCoupon — eligibility", () => {
  it("rejects an inactive coupon", () => {
    const result = validateCoupon(makeCoupon({ active: false }), 5000);
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("rejects an expired coupon", () => {
    const result = validateCoupon(
      makeCoupon({ expiryDate: new Date(Date.now() - 1000) }),
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("rejects a coupon that has not started yet", () => {
    const result = validateCoupon(
      makeCoupon({ startDate: new Date(Date.now() + 60 * 60 * 1000) }),
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("rejects a subtotal below minimumOrderAmount", () => {
    const result = validateCoupon(
      makeCoupon({ minimumOrderAmount: 1500 }),
      1000
    );
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("accepts a subtotal exactly at minimumOrderAmount", () => {
    const result = validateCoupon(
      makeCoupon({ minimumOrderAmount: 1500 }),
      1500
    );
    expect(result.valid).toBe(true);
  });

  it("rejects a coupon whose usageLimit has been reached", () => {
    const result = validateCoupon(
      makeCoupon({ usageLimit: 500, usedCount: 500 }),
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("accepts a coupon below its usageLimit", () => {
    const result = validateCoupon(
      makeCoupon({ usageLimit: 500, usedCount: 499 }),
      5000
    );
    expect(result.valid).toBe(true);
  });

  it("returns { valid: false, discount: 0 } for a null coupon", () => {
    expect(validateCoupon(null, 5000)).toEqual(
      expect.objectContaining({ valid: false, discount: 0 })
    );
  });
});
