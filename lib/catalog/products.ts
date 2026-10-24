import type {
  Inventory,
  Product,
  ProductImage,
  ProductVariant,
} from "@prisma/client";

/**
 * Shared Prisma include for storefront product payloads:
 * images, category, active variants (+ their inventory), inventory rows.
 */
export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { active: true },
    orderBy: { sortOrder: "asc" as const },
    include: { inventory: true },
  },
  inventories: true,
} as const;

export type ProductCard = Product & {
  images: ProductImage[];
  category: { id: string; name: string; slug: string } | null;
  variants: (ProductVariant & { inventory: Inventory | null })[];
  inventories: Inventory[];
};

function availableOf(row: Inventory | null | undefined): number {
  if (!row) return 0;
  return Math.max(0, row.quantity - row.reserved);
}

/**
 * Attach computed `available` (quantity - reserved) to a product and its
 * variants. Availability is derived server-side from inventory rows.
 */
export function withAvailability<T extends ProductCard>(product: T) {
  const productRow = product.inventories.find((i) => i.variantId === null);
  const variants = product.variants.map((v) => ({
    ...v,
    available: availableOf(v.inventory),
  }));
  // Variant products keep stock on variant rows; the product-level row is a
  // placeholder (admin product creation always creates one at quantity 0).
  // No-variant products use the product-level row instead.
  const available =
    variants.length > 0
      ? variants.reduce((sum, v) => sum + v.available, 0)
      : availableOf(productRow);
  return {
    ...product,
    available,
    variants,
  };
}
