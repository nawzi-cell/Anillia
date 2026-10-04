import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageHeader title="Edit product" description="Update catalogue details." />
      <ProductForm productId={params.id} />
    </>
  );
}
