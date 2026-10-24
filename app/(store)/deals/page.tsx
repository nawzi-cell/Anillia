import type { Metadata } from "next";
import {
  serverFetch,
  type Paginated,
  type ProductListItem,
} from "@/lib/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
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
    <>
      <PageHeader
        eyebrow="Limited time"
        title={
          <>
            Deals & <em className="text-olive-dark">Offers</em>
          </>
        }
        description="Thoughtful savings on pieces you will reach for every day. When they are gone, they are gone."
        trail={[{ label: "Deals" }]}
        meta={
          deals.length > 0 ? (
            <p className="flex items-baseline gap-2 border-b border-espresso/15 pb-1 font-sans text-[10px] uppercase tracking-widest2 text-taupe-dark">
              <span className="font-serif text-2xl italic text-espresso">
                {deals.length}
              </span>
              offer{deals.length === 1 ? "" : "s"}
            </p>
          ) : undefined
        }
      />

      <div className="container-x py-10 pb-16 md:pb-24">
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
    </>
  );
}
