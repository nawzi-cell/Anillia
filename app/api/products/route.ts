import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { paginationSchema } from "@/lib/validation/schemas";
import { productCardInclude, withAvailability } from "@/lib/catalog/products";

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  collection: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  color: z.string().trim().max(40).optional(),
  inStock: z
    .preprocess((v) => v === "true" || v === true, z.boolean())
    .optional(),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "popular", "featured"])
    .default("newest"),
});

const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  popular: { soldCount: "desc" },
  featured: { featured: "desc" },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const q = querySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const and: Prisma.ProductWhereInput[] = [{ published: true }];

    if (q.search) {
      and.push({
        OR: [
          { name: { contains: q.search, mode: "insensitive" } },
          { description: { contains: q.search, mode: "insensitive" } },
          { sku: { contains: q.search, mode: "insensitive" } },
        ],
      });
    }
    if (q.category) and.push({ category: { slug: q.category } });
    if (q.collection) {
      and.push({ collections: { some: { collection: { slug: q.collection } } } });
    }
    if (q.minPrice != null || q.maxPrice != null) {
      and.push({
        price: {
          ...(q.minPrice != null ? { gte: q.minPrice } : {}),
          ...(q.maxPrice != null ? { lte: q.maxPrice } : {}),
        },
      });
    }
    if (q.color) and.push({ colors: { has: q.color } });
    if (q.inStock) {
      and.push({
        OR: [
          { inventories: { some: { variantId: null, quantity: { gt: 0 } } } },
          {
            variants: {
              some: { active: true, inventory: { quantity: { gt: 0 } } },
            },
          },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = { AND: and };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productCardInclude,
        orderBy: q.sort === "featured" ? [{ featured: "desc" }, { createdAt: "desc" }] : sortMap[q.sort],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(
      products.map((p) => withAvailability(p)),
      q.page,
      q.limit,
      total
    );
  } catch (e) {
    return handleApiError(e);
  }
}
