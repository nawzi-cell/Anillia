"use client";

import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <TaxonomyManager
      endpoint="/api/admin/categories"
      title="Categories"
      singular="Category"
      description="Product categories shown in storefront navigation."
    />
  );
}
