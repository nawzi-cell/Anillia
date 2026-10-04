import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { productCardInclude, withAvailability } from "@/lib/catalog/products";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        ...productCardInclude,
        collections: {
          include: { collection: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!product) {
      return fail("Product not found.", 404);
    }

    // Unpublished products are visible to admins only.
    if (!product.published) {
      const user = await getCurrentUser();
      if (!user || user.role !== "ADMIN") {
        return fail("Product not found.", 404);
      }
    }

    const [count, avg] = await Promise.all([
      prisma.review.count({
        where: { productId: product.id, status: "APPROVED" },
      }),
      prisma.review.aggregate({
        where: { productId: product.id, status: "APPROVED" },
        _avg: { rating: true },
      }),
    ]);

    return ok({
      ...withAvailability(product),
      reviewSummary: {
        count,
        average: avg._avg.rating ? Number(avg._avg.rating.toFixed(1)) : null,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
