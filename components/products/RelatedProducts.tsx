import { serverFetch, type Paginated, type ProductListItem } from "@/lib/api/client";
import { ProductGrid } from "./ProductGrid";
import { SectionHeading } from "@/components/shared/SectionHeading";

export async function RelatedProducts({
  categorySlug,
  excludeId,
}: {
  categorySlug: string;
  excludeId: string;
}) {
  let items: ProductListItem[] = [];
  try {
    const data = await serverFetch<Paginated<ProductListItem>>(
      `/api/products?category=${encodeURIComponent(categorySlug)}&limit=5`
    );
    items = (data.items ?? []).filter((p) => p.id !== excludeId).slice(0, 4);
  } catch {
    items = [];
  }

  if (items.length === 0) return null;

  return (
    <section aria-label="Related products" className="container-x pb-16 md:pb-20">
      <SectionHeading
        eyebrow="Complete the look"
        title="You may also like"
        link={{ label: "Shop all", href: "/shop" }}
      />
      <ProductGrid products={items} />
    </section>
  );
}
