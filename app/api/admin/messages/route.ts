import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";

/** Admin: list contact messages, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const [total, messages] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(messages, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
