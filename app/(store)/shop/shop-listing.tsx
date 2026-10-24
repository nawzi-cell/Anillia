import Link from "next/link";
import {
  serverFetch,
  type Category,
  type Collection,
  type Paginated,
  type ProductListItem,
} from "@/lib/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchX } from "lucide-react";

export interface ShopSearchParams {
  search?: string;
  category?: string;
  collection?: string;
  minPrice?: string;
  maxPrice?: string;
  color?: string;
  inStock?: string;
  sort?: string;
  page?: string;
}

/** Raw searchParams object as provided by Next.js (values may be arrays). */
export type RawSearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function normalize(params: RawSearchParams): ShopSearchParams {
  return {
    search: first(params.search),
    category: first(params.category),
    collection: first(params.collection),
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    color: first(params.color),
    inStock: first(params.inStock),
    sort: first(params.sort),
    page: first(params.page),
  };
}

function buildQuery(params: ShopSearchParams, lockedCategory?: string): string {
  const q = new URLSearchParams();
  const set = (k: string, v?: string) => {
    if (v) q.set(k, v);
  };
  set("search", params.search);
  set("category", lockedCategory ?? params.category);
  set("collection", params.collection);
  set("minPrice", params.minPrice);
  set("maxPrice", params.maxPrice);
  set("color", params.color);
  set("inStock", params.inStock);
  set("sort", params.sort);
  set("page", params.page);
  q.set("limit", "12");
  return q.toString();
}

export async function ShopListing({
  searchParams: rawParams,
  lockedCategory,
  title,
  description,
  trail,
}: {
  searchParams: RawSearchParams;
  lockedCategory?: string;
  title: string;
  description?: string;
  trail: { label: string; href?: string }[];
}) {
  const searchParams = normalize(rawParams);
  const [categories, collections, products] = await Promise.all([
    serverFetch<Category[]>("/api/categories").catch(() => [] as Category[]),
    serverFetch<Collection[]>("/api/collections").catch(() => [] as Collection[]),
    serverFetch<Paginated<ProductListItem>>(
      `/api/products?${buildQuery(searchParams, lockedCategory)}`
    ).catch(
      () =>
        ({ items: [], page: 1, limit: 12, total: 0, totalPages: 0 }) as Paginated<ProductListItem>
    ),
  ]);

  const items = products.items ?? [];
  const page = products.page ?? 1;
  const totalPages = products.totalPages ?? 0;

  const withPage = (p: number) => {
    const q = new URLSearchParams(buildQuery(searchParams, lockedCategory));
    q.set("page", String(p));
    const qs = q.toString();
    return qs ? `?${qs}` : "?";
  };

  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title={title}
        description={description}
        trail={trail}
        meta={
          products.total > 0 ? (
            <p className="flex items-baseline gap-2 border-b border-espresso/15 pb-1 font-sans text-[10px] uppercase tracking-widest2 text-taupe-dark">
              <span className="font-serif text-2xl italic text-espresso">
                {products.total}
              </span>
              piece{products.total === 1 ? "" : "s"}
            </p>
          ) : undefined
        }
      />

      <div className="container-x pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          <aside aria-label="Product filters" className="lg:sticky lg:top-28 lg:self-start">
            <ProductFilters
              categories={categories}
              collections={collections}
              lockedCategory={lockedCategory}
            />
          </aside>
          <div>
            {items.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No products found"
                description="Try adjusting your filters or search — or browse the full collection."
                action={
                  <Link
                    href={lockedCategory ? `/shop/${lockedCategory}` : "/shop"}
                    className="inline-flex items-center justify-center rounded-full bg-espresso px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-ivory transition-colors hover:bg-espresso-light"
                  >
                    Clear filters
                  </Link>
                }
              />
            ) : (
              <>
                <ProductGrid products={items} columns={3} />
                <Pagination page={page} totalPages={totalPages} buildHref={withPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
