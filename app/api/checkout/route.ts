import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { checkoutSchema } from "@/lib/validation/schemas";
import { createOrder } from "@/lib/orders/checkout";
import { sendEmail } from "@/lib/email";
import { formatPKR } from "@/lib/utils/format";

/**
 * Auth: place an order from the current cart.
 * Pricing, stock, and coupons are all computed/validated server-side —
 * client totals are never trusted.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = checkoutSchema.parse(await req.json());

    const { order } = await createOrder(user.id, {
      addressId: body.addressId,
      address: body.address,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode,
      notes: body.notes,
    });

    // Best-effort order confirmation email — never fails checkout.
    try {
      const lines = order.items
        .map(
          (i) =>
            `• ${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity} — ${formatPKR(i.subtotal)}`
        )
        .join("\n");
      await sendEmail({
        to: user.email,
        subject: `Your ANILLIÉA order ${order.orderNumber} is confirmed`,
        text: [
          `Hi ${user.name},`,
          "",
          "Thank you for your order! Here is your summary:",
          "",
          lines,
          "",
          `Subtotal: ${formatPKR(order.subtotal)}`,
          order.discount > 0 ? `Discount: −${formatPKR(order.discount)}` : null,
          `Delivery: ${formatPKR(order.deliveryFee)}`,
          `Total: ${formatPKR(order.total)}`,
          "",
          "We will notify you when your order ships.",
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<p>Hi ${user.name},</p><p>Thank you for your order <strong>${order.orderNumber}</strong>!</p><p>Total: <strong>${formatPKR(order.total)}</strong></p><p>We will notify you when your order ships.</p>`,
      });
    } catch {
      // Swallowed: email is best-effort.
    }

    return ok(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        couponCode: order.couponCode,
        items: order.items,
        createdAt: order.createdAt,
      },
      201
    );
  } catch (e) {
    return handleApiError(e);
  }
}
