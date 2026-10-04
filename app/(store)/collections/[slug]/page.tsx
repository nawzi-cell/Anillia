import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  serverFetch,
  type Collection,
  type Paginated,
  type ProductListItem,
} from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await serverFetch<{ collection: Collection }>(
    `/api/collections/${params.slug}`
  ).catch(() => null);
  const col = data?.collection;
  return {
    title: col ? col.name : "Collection",
    description: col?.description ?? "Explore this ANILLIÉA collection.",
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const data = await serverFetch<{
    collection: Collection;
    products: ProductListItem[] | Paginated<ProductListItem>;
  }>(`/api/collections/${params.slug}`).catch(() => null);

  if (!data?.collection) notFound();

  const { collection } = data;
  const products = Array.isArray(data.products)
    ? data.products
    : (data.products?.items ?? []);

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs
        trail={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
      />
      <div className="mb-8 mt-2 max-w-2xl">
        <p className="eyebrow mb-3">Collection</p>
        <h1 className="font-serif text-4xl text-espresso md:text-5xl">{collection.name}</h1>
        {collection.description && (
          <p className="mt-3 font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
            {collection.description}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing here yet"
          description="This collection is being curated. Explore the full shop meanwhile."
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
