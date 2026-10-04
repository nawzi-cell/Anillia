import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { updateCartItemSchema } from "@/lib/validation/schemas";
import { getCartWithTotals, availableUnits } from "@/lib/cart/cart";

/** Auth: load a cart item that belongs to the current user. */
async function getOwnItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { userId: true } },
      product: { include: { inventories: true } },
      variant: { include: { inventory: true } },
    },
  });
  if (!item || item.cart.userId !== userId) {
    throw new ApiError(404, "Cart item not found.");
  }
  return item;
}

/** Auth: update quantity (0 removes the item). Stock validated server-side. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = updateCartItemSchema.parse(await req.json());
    const item = await getOwnItem(user.id, params.id);

    if (body.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return ok(await getCartWithTotals(user.id));
    }

    const inventoryRow = item.variant
      ? item.variant.inventory
      : (item.product.inventories.find((i) => i.variantId === null) ?? null);
    const available = availableUnits(inventoryRow);
    if (body.quantity > available) {
      return fail(`Only ${available} unit(s) available for this item.`, 422);
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: body.quantity },
    });

    return ok(await getCartWithTotals(user.id));
  } catch (e) {
    return handleApiError(e);
  }
}

/** Auth: remove an item from the cart. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const item = await getOwnItem(user.id, params.id);
    await prisma.cartItem.delete({ where: { id: item.id } });
    return ok(await getCartWithTotals(user.id));
  } catch (e) {
    return handleApiError(e);
  }
}
