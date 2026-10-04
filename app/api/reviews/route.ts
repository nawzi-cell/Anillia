import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok, fail, paginated } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { reviewSchema, paginationSchema } from "@/lib/validation/schemas";

/**
 * Auth: submit a product review.
 * Only customers with a DELIVERED order containing the product may review
 * (verifiedPurchase is set automatically). One review per product per user.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = reviewSchema.parse(await req.json());

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true, published: true },
    });
    if (!product || !product.published) {
      throw new ApiError(404, "Product not found.");
    }

    let deliveredOrderId: string | null = null;

    if (body.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: body.orderId,
          userId: user.id,
          status: "DELIVERED",
          items: { some: { productId: body.productId } },
        },
        select: { id: true },
      });
      if (!order) {
        return fail("Only verified purchases can be reviewed.", 403);
      }
      deliveredOrderId = order.id;
    } else {
      const order = await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: "DELIVERED",
          items: { some: { productId: body.productId } },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!order) {
        return fail("Only verified purchases can be reviewed.", 403);
      }
      deliveredOrderId = order.id;
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: body.productId, userId: user.id } },
      select: { id: true },
    });
    if (existing) {
      return fail("You have already reviewed this product.", 409);
    }

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        userId: user.id,
        orderId: deliveredOrderId,
        rating: body.rating,
        title: body.title ?? null,
        comment: body.comment,
        verifiedPurchase: true,
        status: "PENDING",
      },
    });

    return ok(review, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

const listQuerySchema = paginationSchema.extend({
  productId: z.string().uuid("Invalid product id"),
});

/** Public: approved reviews for a product, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const q = listQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = { productId: q.productId, status: "APPROVED" as const };
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(reviews, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}
