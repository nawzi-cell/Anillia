import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, paginated, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { productSchema, paginationSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

const listQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  published: z.preprocess((v) => v === "true" || v === true, z.boolean()).optional(),
});

/** Admin: list all products including unpublished. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = listQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    const where = {
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              { sku: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.published !== undefined ? { published: q.published } : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          _count: { select: { variants: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(products, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: create a product with variants, images, inventory rows, collections. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = productSchema.parse(await req.json());

    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });
      if (!category) return fail("Category not found.", 400);
    }

    const slug = await uniqueProductSlug(
      body.slug?.trim() || slugify(body.name)
    );

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: body.name,
          slug,
          description: body.description,
          shortDescription: body.shortDescription ?? null,
          price: body.price,
          compareAtPrice: body.compareAtPrice ?? null,
          sku: body.sku,
          categoryId: body.categoryId ?? null,
          colors: body.colors,
          material: body.material ?? null,
          careInstructions: body.careInstructions ?? null,
          featured: body.featured,
          published: body.published,
          images: {
            create: body.images.map((img, i) => ({
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: img.sortOrder ?? i,
            })),
          },
          variants: {
            create: body.variants.map((v) => ({
              name: v.name,
              color: v.color ?? null,
              size: v.size ?? null,
              sku: v.sku,
              price: v.price ?? null,
              compareAtPrice: v.compareAtPrice ?? null,
              active: v.active,
              sortOrder: v.sortOrder,
            })),
          },
          collections: {
            create: body.collectionIds.map((collectionId) => ({
              collectionId,
            })),
          },
        },
        include: { variants: true },
      });

      // Product-level inventory row (variantId = null).
      await tx.inventory.create({
        data: { productId: created.id, quantity: 0 },
      });

      // Per-variant inventory rows.
      for (const v of created.variants) {
        const input = body.variants.find((x) => x.sku === v.sku);
        await tx.inventory.create({
          data: {
            productId: created.id,
            variantId: v.id,
            quantity: input?.quantity ?? 0,
            lowStockThreshold: input?.lowStockThreshold ?? 10,
          },
        });
      }

      return created;
    });

    void logAudit({
      userId: admin.id,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      metadata: { name: product.name, slug: product.slug },
      ip: getClientIp(req),
    });

    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        inventories: true,
      },
    });

    return ok(full, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
