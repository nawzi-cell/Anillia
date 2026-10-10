import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { cartItemSchema } from "@/lib/validation/schemas";
import { getOrCreateCart, getCartWithTotals, availableUnits } from "@/lib/cart/cart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Auth: add an item to the cart (upserts when the same product+variant
 * is already present). Stock is validated server-side.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = cartItemSchema.parse(await req.json());

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      include: { inventories: true },
    });
    if (!product || !product.published) {
      throw new ApiError(404, "Product not found.");
    }

    let variant: {
      id: string;
      price: number | null;
      active: boolean;
      inventory: { quantity: number; reserved: number } | null;
    } | null = null;
    if (body.variantId) {
      const found = await prisma.productVariant.findFirst({
        where: { id: body.variantId, productId: product.id },
        include: { inventory: true },
      });
      if (!found || !found.active) {
        throw new ApiError(404, "Variant not found.");
      }
      variant = found;
    }

    const inventoryRow = variant
      ? variant.inventory
      : (product.inventories.find((i) => i.variantId === null) ?? null);
    const available = availableUnits(inventoryRow);

    const cart = await getOrCreateCart(user.id);

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
        variantId: body.variantId ?? null,
      },
    });

    const nextQuantity = (existing?.quantity ?? 0) + body.quantity;
    if (nextQuantity > available) {
      return fail(
        `Only ${available} unit(s) available for this item.`,
        422
      );
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: body.variantId ?? null,
          quantity: body.quantity,
        },
      });
    }

    return ok(await getCartWithTotals(user.id), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
