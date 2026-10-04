import { randomBytes } from "node:crypto";
import {
  type Coupon,
  type Order,
  type OrderItem,
  type PaymentMethod,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { validateCoupon, type CouponLike } from "@/lib/coupons/engine";
import { calculateTotals } from "@/lib/orders/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { generateOrderNumber } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckoutAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country?: string | null;
}

export interface CheckoutInput {
  addressId?: string;
  address?: CheckoutAddressInput;
  deliveryMethod: "STANDARD" | "EXPRESS";
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string | null;
}

export interface InventoryCheckItem {
  sku: string;
  quantity: number;
  available: number;
}

export interface InventoryProblem {
  sku: string;
  requested: number;
  available: number;
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-testable)
// ---------------------------------------------------------------------------

/**
 * Pure inventory check: returns the items whose requested quantity exceeds
 * availability. An empty array means everything is in stock.
 */
export function checkInventory(
  items: InventoryCheckItem[]
): InventoryProblem[] {
  return items
    .filter((item) => item.quantity > item.available)
    .map((item) => ({
      sku: item.sku,
      requested: item.quantity,
      available: item.available,
    }));
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

async function generateUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateOrderNumber();
    const exists = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    // Extremely unlikely collision: perturb randomness and retry.
    randomBytes(1);
  }
  throw new ApiError(
    500,
    "Could not generate a unique order number. Please try again."
  );
}

// ---------------------------------------------------------------------------
// createOrder — full checkout transaction
// ---------------------------------------------------------------------------

/**
 * Place an order from the user's current cart.
 *
 * - NEVER trusts client prices: effective price is variant.price ?? product.price.
 * - Stock is checked server-side (available = quantity - reserved); 422 if short.
 * - Pricing (subtotal/discount/delivery/total) is computed server-side.
 * - Coupon is validated server-side; usedCount incremented + CouponUsage row created.
 * - Order + items + payment are created in ONE prisma.$transaction; inventory
 *   decremented, product soldCount incremented, cart cleared, and a
 *   "Order confirmed" notification created.
 */
export async function createOrder(
  userId: string,
  input: CheckoutInput
): Promise<{ order: Order & { items: OrderItem[] } }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "Unauthorized");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventories: true,
            },
          },
          variant: {
            include: { inventory: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty.");
  }

  // Resolve effective prices and availability from server-side data only.
  const lines = cart.items.map((item) => {
    const price = item.variant?.price ?? item.product.price;
    const inventoryRow = item.variant
      ? item.variant.inventory
      : (item.product.inventories.find((i) => i.variantId === null) ?? null);
    const available = inventoryRow
      ? inventoryRow.quantity - inventoryRow.reserved
      : 0;
    return {
      cartItem: item,
      productName: item.product.name,
      variantName: item.variant?.name ?? null,
      sku: item.variant?.sku ?? item.product.sku,
      price,
      quantity: item.quantity,
      available,
      inventoryRowId: inventoryRow?.id ?? null,
    };
  });

  const problems = checkInventory(
    lines.map((l) => ({
      sku: l.sku,
      quantity: l.quantity,
      available: l.available,
    }))
  );
  if (problems.length > 0) {
    throw new ApiError(
      422,
      "Some items in your cart are no longer available in the requested quantity.",
      problems
    );
  }

  // Coupon: validated server-side against the server-computed subtotal.
  const subtotalPreview = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const couponCode = (input.couponCode ?? cart.couponCode ?? "").trim().toUpperCase();
  let coupon: Coupon | null = null;
  if (couponCode) {
    const found = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    const check = validateCoupon(found ? toCouponLike(found) : null, subtotalPreview);
    if (!check.valid) {
      throw new ApiError(400, check.message ?? "Coupon is not valid.");
    }
    coupon = found;
  }

  const totals = calculateTotals({
    items: lines.map((l) => ({ price: l.price, quantity: l.quantity })),
    coupon: coupon ? toCouponLike(coupon) : null,
    deliveryMethod: input.deliveryMethod,
  });

  // Resolve shipping snapshot.
  let shipping: {
    shippingName: string;
    shippingPhone: string;
    shippingAddressLine1: string;
    shippingAddressLine2: string | null;
    shippingCity: string;
    shippingProvince: string;
    shippingPostalCode: string | null;
  };
  if (input.addressId) {
    const addr = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    });
    if (!addr) throw new ApiError(400, "Shipping address not found.");
    shipping = {
      shippingName: addr.fullName,
      shippingPhone: addr.phone,
      shippingAddressLine1: addr.addressLine1,
      shippingAddressLine2: addr.addressLine2,
      shippingCity: addr.city,
      shippingProvince: addr.province,
      shippingPostalCode: addr.postalCode,
    };
  } else if (input.address) {
    shipping = {
      shippingName: input.address.fullName,
      shippingPhone: input.address.phone,
      shippingAddressLine1: input.address.addressLine1,
      shippingAddressLine2: input.address.addressLine2 ?? null,
      shippingCity: input.address.city,
      shippingProvince: input.address.province,
      shippingPostalCode: input.address.postalCode ?? null,
    };
  } else {
    throw new ApiError(400, "A shipping address is required.");
  }

  // Initiate payment (COD / bank transfer record instructions; ONLINE throws).
  const provider = getPaymentProvider(input.paymentMethod);
  const paymentResult = await provider.initiate({
    orderId: "pending",
    amount: totals.total,
    currency: "PKR",
    method: input.paymentMethod,
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? shipping.shippingPhone,
    },
  });

  const orderNumber = await generateUniqueOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: input.paymentMethod,
        deliveryMethod: input.deliveryMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.delivery,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        shippingName: shipping.shippingName,
        shippingPhone: shipping.shippingPhone,
        shippingAddressLine1: shipping.shippingAddressLine1,
        shippingAddressLine2: shipping.shippingAddressLine2,
        shippingCity: shipping.shippingCity,
        shippingProvince: shipping.shippingProvince,
        shippingPostalCode: shipping.shippingPostalCode,
        notes: input.notes ?? null,
        items: {
          create: lines.map((l) => ({
            productId: l.cartItem.productId,
            variantId: l.cartItem.variantId,
            productName: l.productName,
            variantName: l.variantName,
            sku: l.sku,
            price: l.price,
            quantity: l.quantity,
            subtotal: l.price * l.quantity,
          })),
        },
        payment: {
          create: {
            method: input.paymentMethod,
            status: "PENDING",
            amount: totals.total,
            currency: "PKR",
            provider: paymentResult.provider,
            metadata: {
              instructions: paymentResult.instructions ?? null,
              message: paymentResult.message,
            },
          },
        },
      },
      include: { items: true },
    });

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
      await tx.couponUsage.create({
        data: { couponId: coupon.id, userId, orderId: created.id },
      });
    }

    for (const l of lines) {
      if (l.inventoryRowId) {
        await tx.inventory.update({
          where: { id: l.inventoryRowId },
          data: { quantity: { decrement: l.quantity } },
        });
      }
      await tx.product.update({
        where: { id: l.cartItem.productId },
        data: { soldCount: { increment: l.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    await tx.notification.create({
      data: {
        userId,
        title: "Order confirmed",
        message: `Your order ${orderNumber} has been placed successfully.`,
        link: `/account/orders/${created.id}`,
      },
    });

    return created;
  });

  return { order };
}
