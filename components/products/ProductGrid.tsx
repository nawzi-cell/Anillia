import type { ProductListItem } from "@/lib/api/client";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  columns = 4,
}: {
  products: ProductListItem[];
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 4
      ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      : columns === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-2";
  return (
    <div className={`grid gap-x-4 gap-y-8 sm:gap-x-6 ${cols}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
