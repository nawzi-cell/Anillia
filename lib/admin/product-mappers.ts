import type { Prisma } from "@prisma/client";

export const adminProductListInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  variants: {
    select: { id: true, name: true, sku: true },
    orderBy: { sortOrder: "asc" },
  },
  inventories: {
    select: { variantId: true, quantity: true, reserved: true },
  },
} satisfies Prisma.ProductInclude;

export const adminProductFullInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: {
    include: { inventory: true },
    orderBy: { sortOrder: "asc" },
  },
  category: { select: { id: true, name: true, slug: true } },
  inventories: true,
  collections: {
    select: { collectionId: true },
  },
} satisfies Prisma.ProductInclude;

type AdminProductListRow = Prisma.ProductGetPayload<{
  include: typeof adminProductListInclude;
}>;

type AdminProductFullRow = Prisma.ProductGetPayload<{
  include: typeof adminProductFullInclude;
}>;

function available(row: { quantity: number; reserved: number }): number {
  return Math.max(0, row.quantity - row.reserved);
}

function stockForProduct(
  product: Pick<AdminProductListRow, "variants" | "inventories">,
): number {
  const rows =
    product.variants.length > 0
      ? product.inventories.filter((i) => i.variantId !== null)
      : product.inventories.filter((i) => i.variantId === null);

  return rows.reduce((sum, row) => sum + available(row), 0);
}

export function mapAdminProductListItem(product: AdminProductListRow) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    published: product.published,
    featured: product.featured,
    category: product.category,
    images: product.images.map((image) => ({ url: image.url })),
    variants: product.variants,
    stock: stockForProduct(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function mapAdminProductFull(product: AdminProductFullRow) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    published: product.published,
    featured: product.featured,
    category: product.category,
    categoryId: product.categoryId,
    stock: stockForProduct(product),
    description: product.description,
    shortDescription: product.shortDescription,
    colors: product.colors,
    material: product.material,
    careInstructions: product.careInstructions,
    collections: product.collections.map((collection) => collection.collectionId),
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      color: variant.color,
      size: variant.size,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      active: variant.active,
      sortOrder: variant.sortOrder,
      quantity: variant.inventory?.quantity ?? 0,
      lowStockThreshold: variant.inventory?.lowStockThreshold ?? 10,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
