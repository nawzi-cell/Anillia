import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

/** Auth: list own notifications, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = { userId: user.id };
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(notifications, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
