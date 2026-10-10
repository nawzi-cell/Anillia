import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { messageReadSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Admin: mark a contact message as read/unread. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.contactMessage.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Message not found.", 404);

    const body = messageReadSchema.parse(await req.json());

    const message = await prisma.contactMessage.update({
      where: { id: params.id },
      data: { read: body.read },
    });

    void logAudit({
      userId: admin.id,
      action: "message.update",
      entity: "ContactMessage",
      entityId: message.id,
      metadata: { read: message.read },
      ip: getClientIp(req),
    });

    return ok(message);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a contact message. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.contactMessage.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Message not found.", 404);

    await prisma.contactMessage.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "message.delete",
      entity: "ContactMessage",
      entityId: params.id,
      ip: getClientIp(req),
    });

    return ok({ message: "Message deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
