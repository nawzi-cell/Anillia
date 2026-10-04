import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { productSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const updateSchema = productSchema.partial().extend({
  deleteVariantIds: z.array(z.string().uuid()).optional(),
  inventory: z
    .object({
      quantity: z.number().int().min(0).optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
    })
    .optional(),
});

async function uniqueProductSlug(base: string, excludeId: string): Promise<string> {
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

/** Admin: fetch one product (incl. unpublished) with full relations. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        inventories: true,
        collections: {
          include: { collection: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!product) return fail("Product not found.", 404);
    return ok(product);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: update a product incl. nested variants/images/inventory/collections. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Product not found.", 404);

    const body = updateSchema.parse(await req.json());

    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });
      if (!category) return fail("Category not found.", 400);
    }

    const slug = body.slug?.trim()
      ? await uniqueProductSlug(body.slug.trim(), params.id)
      : body.name
        ? await uniqueProductSlug(slugify(body.name), params.id)
        : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: params.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.shortDescription !== undefined
            ? { shortDescription: body.shortDescription ?? null }
            : {}),
          ...(body.price !== undefined ? { price: body.price } : {}),
          ...(body.compareAtPrice !== undefined
            ? { compareAtPrice: body.compareAtPrice ?? null }
            : {}),
          ...(body.sku !== undefined ? { sku: body.sku } : {}),
          ...(body.categoryId !== undefined
            ? { categoryId: body.categoryId ?? null }
            : {}),
          ...(body.colors !== undefined ? { colors: body.colors } : {}),
          ...(body.material !== undefined ? { material: body.material ?? null } : {}),
          ...(body.careInstructions !== undefined
            ? { careInstructions: body.careInstructions ?? null }
            : {}),
          ...(body.featured !== undefined ? { featured: body.featured } : {}),
          ...(body.published !== undefined ? { published: body.published } : {}),
        },
      });

      // Images: full replacement when provided.
      if (body.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: params.id } });
        if (body.images.length > 0) {
          await tx.productImage.createMany({
            data: body.images.map((img, i) => ({
              productId: params.id,
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: img.sortOrder ?? i,
            })),
          });
        }
      }

      // Collections: full replacement when provided.
      if (body.collectionIds !== undefined) {
        await tx.productCollection.deleteMany({
          where: { productId: params.id },
        });
        if (body.collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: body.collectionIds.map((collectionId) => ({
              productId: params.id,
              collectionId,
            })),
          });
        }
      }

      // Variants: update by id, create new, delete listed.
      if (body.deleteVariantIds && body.deleteVariantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: body.deleteVariantIds }, productId: params.id },
        });
      }
      if (body.variants !== undefined) {
        for (const v of body.variants) {
          if (v.id) {
            const owned = await tx.productVariant.findFirst({
              where: { id: v.id, productId: params.id },
              select: { id: true },
            });
            if (!owned) {
              throw new ApiError(400, `Variant ${v.id} does not belong to this product.`);
            }
            const updatedVariant = await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                color: v.color ?? null,
                size: v.size ?? null,
                sku: v.sku,
                price: v.price ?? null,
                compareAtPrice: v.compareAtPrice ?? null,
                active: v.active,
                sortOrder: v.sortOrder,
              },
            });
            await tx.inventory.upsert({
              where: { variantId: updatedVariant.id },
              update: {
                ...(v.quantity !== undefined ? { quantity: v.quantity } : {}),
                ...(v.lowStockThreshold !== undefined
                  ? { lowStockThreshold: v.lowStockThreshold }
                  : {}),
              },
              create: {
                productId: params.id,
                variantId: updatedVariant.id,
                quantity: v.quantity ?? 0,
                lowStockThreshold: v.lowStockThreshold ?? 10,
              },
            });
          } else {
            const created = await tx.productVariant.create({
              data: {
                productId: params.id,
                name: v.name,
                color: v.color ?? null,
                size: v.size ?? null,
                sku: v.sku,
                price: v.price ?? null,
                compareAtPrice: v.compareAtPrice ?? null,
                active: v.active,
                sortOrder: v.sortOrder,
              },
            });
            await tx.inventory.create({
              data: {
                productId: params.id,
                variantId: created.id,
                quantity: v.quantity ?? 0,
                lowStockThreshold: v.lowStockThreshold ?? 10,
              },
            });
          }
        }
      }

      // Product-level inventory.
      if (body.inventory !== undefined) {
        const row = await tx.inventory.findFirst({
          where: { productId: params.id, variantId: null },
          select: { id: true },
        });
        if (row) {
          await tx.inventory.update({
            where: { id: row.id },
            data: {
              ...(body.inventory.quantity !== undefined
                ? { quantity: body.inventory.quantity }
                : {}),
              ...(body.inventory.lowStockThreshold !== undefined
                ? { lowStockThreshold: body.inventory.lowStockThreshold }
                : {}),
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: params.id,
              quantity: body.inventory.quantity ?? 0,
              lowStockThreshold: body.inventory.lowStockThreshold ?? 10,
            },
          });
        }
      }
    });

    void logAudit({
      userId: admin.id,
      action: "product.update",
      entity: "Product",
      entityId: params.id,
      ip: getClientIp(req),
    });

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        inventories: true,
      },
    });
    return ok(product);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a product (blocked when referenced by order items). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!existing) return fail("Product not found.", 404);

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: params.id },
    });
    if (orderItemCount > 0) {
      return fail(
        "This product cannot be deleted because it appears in existing orders. Unpublish it instead.",
        409
      );
    }

    await prisma.product.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "product.delete",
      entity: "Product",
      entityId: params.id,
      metadata: { name: existing.name },
      ip: getClientIp(req),
    });

    return ok({ message: "Product deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
