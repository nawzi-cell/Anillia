/**
 * Local editorial art for taxonomy records whose database image column is
 * empty. Keeping it in code avoids a data migration while giving the
 * storefront cohesive imagery on every fresh install.
 */
export const CATEGORY_IMAGERY: Record<string, string> = {
  "modest-essentials": "/images/categories/modest-essentials.webp",
  hijabs: "/images/categories/hijabs.webp",
  underscarves: "/images/categories/underscarves.webp",
  niqabs: "/images/categories/niqabs.webp",
};

export const COLLECTION_IMAGERY: Record<string, string> = {
  "everyday-edit": "/images/collections/everyday-edit.webp",
  "signature-bundles": "/images/collections/signature-bundles.webp",
  "gift-edit": "/images/collections/gift-edit.webp",
};

export function categoryImage(slug: string, image?: string | null) {
  return image || CATEGORY_IMAGERY[slug] || null;
}

export function collectionImage(slug: string, image?: string | null) {
  return image || COLLECTION_IMAGERY[slug] || null;
}
