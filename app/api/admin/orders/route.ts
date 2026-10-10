import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
]);
const paymentStatusEnum = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]);

const querySchema = paginationSchema.extend({
  status: orderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
});

/** Admin: list orders with status/payment filters and order-number/customer search. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = querySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const and: Prisma.OrderWhereInput[] = [];
    if (q.status) and.push({ status: q.status });
    if (q.paymentStatus) and.push({ paymentStatus: q.paymentStatus });
    if (q.search) {
      and.push({
        OR: [
          { orderNumber: { contains: q.search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { email: { contains: q.search, mode: "insensitive" } },
                { name: { contains: q.search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    const where: Prisma.OrderWhereInput = and.length > 0 ? { AND: and } : {};

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(orders, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
