import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Auth: fetch one of the current user's orders. Never leaks others' orders. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();

    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return fail("Order not found.", 404);
    }

    return ok(order);
  } catch (e) {
    return handleApiError(e);
  }
}
