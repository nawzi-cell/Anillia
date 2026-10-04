import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

/** Auth: list the current user's orders, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = { userId: user.id };
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: { select: { method: true, status: true, provider: true } },
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
