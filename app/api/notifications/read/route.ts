import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const readSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
});

/** Auth: mark notifications as read (specific ids, or all unread). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = readSchema.parse(await req.json());

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        ...(body.ids && body.ids.length > 0
          ? { id: { in: body.ids } }
          : { read: false }),
      },
      data: { read: true },
    });

    return ok({ marked: result.count });
  } catch (e) {
    return handleApiError(e);
  }
}
