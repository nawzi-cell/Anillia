import type { Metadata } from "next";
import { ShopListing, type RawSearchParams } from "./shop-listing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse ANILLIÉA's curated range of modest essentials — hijabs, underscarves, accessories and bundles. Delivered across Pakistan.",
};

export default function ShopPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const rawSearch = searchParams.search;
  const searching = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch)?.trim();
  return (
    <ShopListing
      searchParams={searchParams}
      title={searching ? `Results for “${searching}”` : "Shop All"}
      description={
        searching
          ? undefined
          : "Thoughtfully curated modest essentials — hijabs, underscarves, accessories and bundles."
      }
      trail={[{ label: "Shop" }]}
    />
  );
}
