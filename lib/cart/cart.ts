import { prisma } from "@/lib/db/prisma";
import { calculateTotals } from "@/lib/orders/pricing";
import { validateCoupon, type CouponLike } from "@/lib/coupons/engine";
import type { Coupon } from "@prisma/client";

/**
 * Cart domain helpers: ensure a cart exists, serialize it with
 * server-computed pricing.
 */

const cartItemsInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      published: true,
      images: {
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
      inventories: true,
    },
  },
  variant: {
    include: { inventory: true },
  },
} as const;

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

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

/** Available units for a product- or variant-level inventory row. */
export function availableUnits(
  inventory: { quantity: number; reserved: number } | null | undefined
): number {
  if (!inventory) return 0;
  return Math.max(0, inventory.quantity - inventory.reserved);
}

/**
 * Load the user's cart with items and compute server-side totals:
 * unit prices from variant.price ?? product.price, coupon discount
 * validated against the live subtotal.
 */
export async function getCartWithTotals(userId: string) {
  const cart = await getOrCreateCart(userId);

  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: cartItemsInclude, orderBy: { createdAt: "asc" } } },
  });
  if (!full) throw new Error("Cart not found after creation");

  const items = full.items.map((item) => {
    const unitPrice = item.variant?.price ?? item.product.price;
    const inventoryRow = item.variant
      ? item.variant.inventory
      : (item.product.inventories.find((i) => i.variantId === null) ?? null);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      available: availableUnits(inventoryRow),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        images: item.product.images,
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            sku: item.variant.sku,
            price: item.variant.price,
          }
        : null,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  let coupon: Coupon | null = null;
  if (full.couponCode) {
    const found = await prisma.coupon.findUnique({
      where: { code: full.couponCode },
    });
    if (found && validateCoupon(toCouponLike(found), subtotal).valid) {
      coupon = found;
    }
  }

  const totals = calculateTotals({
    items: items.map((i) => ({ price: i.unitPrice, quantity: i.quantity })),
    coupon: coupon ? toCouponLike(coupon) : null,
    deliveryMethod: "STANDARD",
  });

  return {
    id: full.id,
    items,
    couponCode: coupon?.code ?? null,
    subtotal: totals.subtotal,
    discount: totals.discount,
    delivery: totals.delivery,
    total: totals.total,
  };
}
