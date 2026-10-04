import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
});

/** Admin: list all users (staff + customers), searchable by name/email. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = querySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );

    const where: Prisma.UserWhereInput = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              { email: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(users, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
