import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { reviewStatusUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

/** Admin: moderate a review (approve / hide). */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Review not found.", 404);

    const body = reviewStatusUpdateSchema.parse(await req.json());

    const review = await prisma.review.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    void logAudit({
      userId: admin.id,
      action: "review.moderate",
      entity: "Review",
      entityId: review.id,
      metadata: { status: review.status },
      ip: getClientIp(req),
    });

    return ok(review);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a review. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Review not found.", 404);

    await prisma.review.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "review.delete",
      entity: "Review",
      entityId: params.id,
      ip: getClientIp(req),
    });

    return ok({ message: "Review deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
