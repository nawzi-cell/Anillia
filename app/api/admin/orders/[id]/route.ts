import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";
import {
  allowedNextStatuses,
  canTransition,
  restoresInventory,
} from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const uuid = z.string().uuid();

const orderInclude = {
  items: true,
  payment: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const;

/** Admin: fetch one order with items, payment, and customer. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    if (!uuid.safeParse(params.id).success) return fail("Order not found.", 404);
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: orderInclude,
    });
    if (!order) return fail("Order not found.", 404);
    return ok(order);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: transition order status / update payment status. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    if (!uuid.safeParse(params.id).success) return fail("Order not found.", 404);

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        status: true,
        couponCode: true,
        items: { select: { productId: true, variantId: true, quantity: true, productName: true } },
      },
    });
    if (!existing) return fail("Order not found.", 404);

    const body = orderStatusUpdateSchema.parse(await req.json());
    const nextStatus = body.status;

    if (nextStatus !== undefined && !canTransition(existing.status, nextStatus)) {
      const allowed = allowedNextStatuses(existing.status);
      return fail(
        allowed.length > 0
          ? `Cannot move an order from ${existing.status} to ${nextStatus}. Allowed next status: ${allowed.join(", ")}.`
          : `An order in ${existing.status} is final and cannot be changed.`,
        409
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (nextStatus !== undefined && nextStatus !== existing.status) {
        // Compare-and-set the previous status: a concurrent admin update or a
        // double-submitted request cannot apply the transition (and restock)
        // twice.
        const claimed = await tx.order.updateMany({
          where: { id: existing.id, status: existing.status },
          data: {
            status: nextStatus,
            ...(body.paymentStatus !== undefined
              ? { paymentStatus: body.paymentStatus }
              : {}),
          },
        });
        if (claimed.count !== 1) {
          throw new ApiError(
            409,
            "This order was updated by someone else. Reload and try again."
          );
        }
        if (body.paymentStatus !== undefined) {
          await tx.payment.updateMany({
            where: { orderId: existing.id },
            data: { status: body.paymentStatus },
          });
        }

        if (restoresInventory(nextStatus)) {
          for (const item of existing.items) {
            const inventory = item.variantId
              ? await tx.inventory.findUnique({
                  where: { variantId: item.variantId },
                  select: { id: true },
                })
              : await tx.inventory.findFirst({
                  where: { productId: item.productId, variantId: null },
                  select: { id: true },
                });
            if (inventory) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: { quantity: { increment: item.quantity } },
              });
            }
            await tx.product.updateMany({
              where: {
                id: item.productId,
                soldCount: { gte: item.quantity },
              },
              data: { soldCount: { decrement: item.quantity } },
            });
          }

          if (existing.couponCode) {
            const coupon = await tx.coupon.findUnique({
              where: { code: existing.couponCode },
              select: { id: true },
            });
            if (coupon) {
              const usage = await tx.couponUsage.findFirst({
                where: { couponId: coupon.id, orderId: existing.id },
                select: { id: true },
              });
              if (usage) {
                await tx.couponUsage.delete({ where: { id: usage.id } });
                await tx.coupon.updateMany({
                  where: { id: coupon.id, usedCount: { gt: 0 } },
                  data: { usedCount: { decrement: 1 } },
                });
              }
            }
          }
        }

        const message =
          nextStatus === "SHIPPED"
            ? { title: "Your order has shipped", message: `Order ${existing.orderNumber} is on its way.` }
            : nextStatus === "DELIVERED"
              ? { title: "Order delivered", message: `Order ${existing.orderNumber} has been delivered. Enjoy!` }
              : nextStatus === "CANCELLED"
                ? { title: "Order cancelled", message: `Order ${existing.orderNumber} has been cancelled. Contact us if you need help.` }
                : nextStatus === "RETURNED"
                  ? { title: "Return completed", message: `The return for order ${existing.orderNumber} has been completed.` }
                  : null;
        if (message) {
          await tx.notification.create({
            data: {
              userId: existing.userId,
              ...message,
              link: `/account/orders/${existing.id}`,
            },
          });
        }
      } else if (body.paymentStatus !== undefined) {
        await tx.order.update({
          where: { id: existing.id },
          data: { paymentStatus: body.paymentStatus },
        });
        await tx.payment.updateMany({
          where: { orderId: existing.id },
          data: { status: body.paymentStatus },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: existing.id },
        include: orderInclude,
      });
    });

    const auditMetadata: Record<string, string> = {};
    if (body.status !== undefined) auditMetadata.status = body.status;
    if (body.paymentStatus !== undefined)
      auditMetadata.paymentStatus = body.paymentStatus;

    void logAudit({
      userId: admin.id,
      action: "order.update",
      entity: "Order",
      entityId: updated.id,
      metadata: auditMetadata,
      ip: getClientIp(req),
    });

    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
