import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

/** Admin: list inventory rows with computed availability and low-stock flag. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const q = paginationSchema.parse(raw);
    const onlyLowStock = raw.lowStock === "true";

    const rows = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        },
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const withFlags = rows.map((inv) => {
      const available = Math.max(0, inv.quantity - inv.reserved);
      return {
        id: inv.id,
        productId: inv.productId,
        quantity: inv.quantity,
        reserved: inv.reserved,
        available,
        lowStockThreshold: inv.lowStockThreshold,
        lowStock: available <= inv.lowStockThreshold,
        updatedAt: inv.updatedAt,
        product: inv.product,
        variant: inv.variant,
      };
    });

    const filtered = onlyLowStock
      ? withFlags.filter((r) => r.lowStock)
      : withFlags;
    const total = filtered.length;
    const items = filtered.slice((q.page - 1) * q.limit, q.page * q.limit);

    return paginated(items, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
