import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

/** Admin: customer detail with addresses and recent orders. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!customer) return fail("Customer not found.", 404);
    return ok(customer);
  } catch (e) {
    return handleApiError(e);
  }
}
