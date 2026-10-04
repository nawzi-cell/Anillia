import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

/** Admin: list newsletter subscribers, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const [total, subscribers] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(subscribers, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
