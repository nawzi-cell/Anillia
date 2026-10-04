"use client";

import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export default function AdminCollectionsPage() {
  return (
    <TaxonomyManager
      endpoint="/api/admin/collections"
      title="Collections"
      singular="Collection"
      description="Curated product groupings featured across the store."
    />
  );
}
