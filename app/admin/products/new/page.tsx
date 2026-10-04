import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function AdminNewProductPage() {
  return (
    <>
      <PageHeader
        title="New product"
        description="Add a product to the ANILLIÉA catalogue."
      />
      <ProductForm />
    </>
  );
}
