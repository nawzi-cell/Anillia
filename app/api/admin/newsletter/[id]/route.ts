import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Admin: remove a newsletter subscriber. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    });
    if (!existing) return fail("Subscriber not found.", 404);

    await prisma.newsletterSubscriber.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "newsletter.delete",
      entity: "NewsletterSubscriber",
      entityId: params.id,
      metadata: { email: existing.email },
      ip: getClientIp(req),
    });

    return ok({ message: "Subscriber removed." });
  } catch (e) {
    return handleApiError(e);
  }
}
