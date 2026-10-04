import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

const querySchema = paginationSchema.extend({
  entity: z.string().trim().max(60).optional(),
  action: z.string().trim().max(60).optional(),
});

/** Admin: list audit logs, optionally filtered by entity/action. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = querySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = {
      ...(q.entity ? { entity: q.entity } : {}),
      ...(q.action ? { action: q.action } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(logs, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
