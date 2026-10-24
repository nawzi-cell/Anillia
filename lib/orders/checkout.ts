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
 * - Coupon usage is claimed with a conditional update so its limit cannot be
 *   exceeded by concurrent checkouts.
 * - The cart is re-read and every product/variant re-validated inside the
 *   transaction, after taking a per-customer advisory lock.
 * - Inventory is decremented with an atomic conditional UPDATE, so two
 *   customers can never buy the last unit.
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

  const orderNumber = await generateUniqueOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Serialise checkouts per customer. Two rapid submissions (double-click,
    // refresh, retry) are processed one after the other; the second finds an
    // empty cart instead of creating a duplicate order.
    // Cast the void return to text; Prisma cannot deserialize a void column.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;

    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { inventories: true } },
            variant: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty.");
    }

    // Resolve effective prices, availability and eligibility from the
    // database, never from client input.
    const lines = cart.items.map((item) => {
      if (!item.product.published) {
        throw new ApiError(
          409,
          `${item.product.name} is no longer available. Please remove it from your bag.`
        );
      }
      if (item.variantId && (!item.variant || !item.variant.active)) {
        throw new ApiError(
          409,
          `${item.product.name} is no longer available in the selected option. Please update your bag.`
        );
      }

      const price = item.variant?.price ?? item.product.price;
      const inventoryRow = item.variant
        ? item.variant.inventory
        : (item.product.inventories.find((i) => i.variantId === null) ?? null);
      const available = inventoryRow
        ? Math.max(0, inventoryRow.quantity - inventoryRow.reserved)
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

    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const couponCode = (input.couponCode ?? cart.couponCode ?? "")
      .trim()
      .toUpperCase();
    let coupon: Coupon | null = null;
    if (couponCode) {
      const found = await tx.coupon.findUnique({ where: { code: couponCode } });
      const check = validateCoupon(found ? toCouponLike(found) : null, subtotal);
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

    // Resolve the shipping snapshot inside the transaction so a deleted
    // address cannot slip through between validation and order creation.
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
      const addr = await tx.address.findFirst({
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

    // COD / bank-transfer providers are local; ONLINE throws here, before
    // any order row is written.
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
      // Claim a usage slot atomically. The conditional update guarantees the
      // global usage limit is never exceeded under concurrent checkouts.
      const now = new Date();
      const claimed =
        coupon.usageLimit != null
          ? await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                active: true,
                usedCount: { lt: coupon.usageLimit },
                startDate: { lte: now },
                OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
              },
              data: { usedCount: { increment: 1 } },
            })
          : await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                active: true,
                startDate: { lte: now },
                OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
              },
              data: { usedCount: { increment: 1 } },
            });
      if (claimed.count !== 1) {
        throw new ApiError(409, "This coupon is no longer available.");
      }
      await tx.couponUsage.create({
        data: { couponId: coupon.id, userId, orderId: created.id },
      });
    }

    for (const l of lines) {
      if (!l.inventoryRowId) {
        throw new ApiError(
          422,
          `${l.productName} is no longer available. Please update your bag.`
        );
      }
      // Atomic conditional decrement: quantity - reserved must still cover
      // the requested units at the moment of the write.
      const updated = await tx.$executeRaw`
        UPDATE "Inventory"
        SET quantity = quantity - ${l.quantity}, "updatedAt" = NOW()
        WHERE id = ${l.inventoryRowId}::uuid
          AND quantity - reserved >= ${l.quantity}
      `;
      if (updated !== 1) {
        throw new ApiError(
          409,
          `${l.productName} just sold out in the requested quantity. Please review your bag.`
        );
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
