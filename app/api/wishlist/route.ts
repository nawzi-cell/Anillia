import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOrCreateWishlist(userId: string) {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wishlist.create({ data: { userId } });
}

const wishlistItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      published: true,
      images: {
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
    },
  },
} as const;

/** Auth: list wishlist items (published products only). */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const wishlist = await getOrCreateWishlist(user.id);
    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id, product: { published: true } },
      include: wishlistItemInclude,
      orderBy: { createdAt: "desc" },
    });
    return ok(items);
  } catch (e) {
    return handleApiError(e);
  }
}

const addSchema = z.object({ productId: z.string().uuid() });

/** Auth: add a product to the wishlist (idempotent). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = addSchema.parse(await req.json());

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true, published: true },
    });
    if (!product || !product.published) {
      throw new ApiError(404, "Product not found.");
    }

    const wishlist = await getOrCreateWishlist(user.id);
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId: product.id },
      },
      update: {},
      create: { wishlistId: wishlist.id, productId: product.id },
    });

    return ok({ message: "Added to wishlist." }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
