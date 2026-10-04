import type { Metadata } from "next";
import {
  serverFetch,
  type Paginated,
  type ProductListItem,
} from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponBanner } from "./CouponBanner";
import { BadgePercent } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals",
  description:
    "ANILLIÉA deals — bundle offers and marked-down modest essentials. Limited time only.",
};

export default async function DealsPage() {
  const data = await serverFetch<Paginated<ProductListItem>>(
    "/api/products?sort=featured&limit=60"
  ).catch(
    () =>
      ({ items: [], page: 1, limit: 60, total: 0, totalPages: 0 }) as Paginated<ProductListItem>
  );

  const deals = (data.items ?? []).filter(
    (p) => p.compareAtPrice != null && p.compareAtPrice > p.price
  );

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Deals" }]} />
      <div className="mb-8 mt-2 max-w-2xl">
        <p className="eyebrow mb-3">Limited time</p>
        <h1 className="font-serif text-4xl text-espresso md:text-5xl">
          Deals & Offers
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
          Thoughtful savings on pieces you will reach for every day. When
          they are gone, they are gone.
        </p>
      </div>

      <CouponBanner />

      {deals.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title="No active deals right now"
          description="Check back soon — or browse the full collection for everyday favourites."
        />
      ) : (
        <div className="mt-10">
          <ProductGrid products={deals} />
        </div>
      )}
    </div>
  );
}
