import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { inventoryUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

/** Admin: adjust an inventory row's quantity / low-stock threshold. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        product: { select: { name: true } },
        variant: { select: { name: true } },
      },
    });
    if (!existing) return fail("Inventory record not found.", 404);

    const body = inventoryUpdateSchema.parse(await req.json());

    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        ...(body.quantity !== undefined ? { quantity: body.quantity } : {}),
        ...(body.lowStockThreshold !== undefined
          ? { lowStockThreshold: body.lowStockThreshold }
          : {}),
      },
    });

    void logAudit({
      userId: admin.id,
      action: "inventory.update",
      entity: "Inventory",
      entityId: updated.id,
      metadata: {
        product: existing.product.name,
        variant: existing.variant?.name ?? null,
        before: { quantity: existing.quantity, lowStockThreshold: existing.lowStockThreshold },
        after: { quantity: updated.quantity, lowStockThreshold: updated.lowStockThreshold },
      },
      ip: getClientIp(req),
    });

    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
