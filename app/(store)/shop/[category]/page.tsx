import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch, type Category } from "@/lib/api/client";
import { ShopListing, type RawSearchParams } from "../shop-listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const category = await serverFetch<Category[]>(
    `/api/categories`
  )
    .then((cats) => cats.find((c) => c.slug === params.category))
    .catch(() => undefined);
  return {
    title: category ? category.name : "Shop",
    description: category?.description ?? "Shop ANILLIÉA modest essentials by category.",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: RawSearchParams;
}) {
  const category = await serverFetch<Category[]>("/api/categories")
    .then((cats) => cats.find((c) => c.slug === params.category))
    .catch(() => undefined);

  if (!category) notFound();

  return (
    <ShopListing
      searchParams={searchParams}
      lockedCategory={category.slug}
      title={category.name}
      description={category.description ?? undefined}
      trail={[{ label: "Shop", href: "/shop" }, { label: category.name }]}
    />
  );
}
