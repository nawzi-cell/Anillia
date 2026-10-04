import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";
import { productCardInclude, withAvailability } from "@/lib/catalog/products";

/** Public: collection detail with its published products (paginated). */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { slug: params.slug },
    });
    if (!collection || !collection.active) {
      return fail("Collection not found.", 404);
    }

    const q = paginationSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = {
      published: true,
      collections: { some: { collectionId: collection.id } },
    };

    const [total, rows] = await Promise.all([
      prisma.productCollection.count({
        where: { collectionId: collection.id, product: { published: true } },
      }),
      prisma.product.findMany({
        where,
        include: productCardInclude,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return ok({
      collection,
      products: {
        items: rows.map((p) => withAvailability(p)),
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
