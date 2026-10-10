import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Auth: remove a product from the wishlist. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (wishlist) {
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId: params.productId },
      });
    }
    return ok({ message: "Removed from wishlist." });
  } catch (e) {
    return handleApiError(e);
  }
}
