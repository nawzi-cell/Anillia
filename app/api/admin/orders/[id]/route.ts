import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

/** Admin: fetch one order with items, payment, and customer. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        payment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) return fail("Order not found.", 404);
    return ok(order);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: update order status / payment status; notifies customer on ship/deliver. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, orderNumber: true, userId: true },
    });
    if (!existing) return fail("Order not found.", 404);

    const body = orderStatusUpdateSchema.parse(await req.json());

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.paymentStatus !== undefined
          ? { paymentStatus: body.paymentStatus }
          : {}),
      },
    });

    // Notify the customer when the order ships or is delivered.
    if (body.status === "SHIPPED" || body.status === "DELIVERED") {
      const notification =
        body.status === "SHIPPED"
          ? {
              title: "Your order has shipped",
              message: `Order ${updated.orderNumber} is on its way.`,
            }
          : {
              title: "Order delivered",
              message: `Order ${updated.orderNumber} has been delivered. Enjoy!`,
            };
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          ...notification,
          link: `/account/orders/${updated.id}`,
        },
      });
    }

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
