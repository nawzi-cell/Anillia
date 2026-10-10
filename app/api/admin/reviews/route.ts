import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "APPROVED", "HIDDEN"]).optional(),
});

/** Admin: list reviews, optionally filtered by status. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = querySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = q.status ? { status: q.status } : {};

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(reviews, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
