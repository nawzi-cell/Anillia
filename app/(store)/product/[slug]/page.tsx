import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  serverFetch,
  toDisplayReview,
  type Paginated,
  type ProductDetail,
  type Review,
} from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Accordion } from "@/components/ui/Accordion";
import { JsonLd } from "@/components/shared/JsonLd";
import { ProductGallery } from "@/components/products/ProductGallery";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ProductPurchase } from "./ProductPurchase";
import { ReviewSection } from "./ReviewSection";

export const dynamic = "force-dynamic";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await serverFetch<ProductDetail>(`/api/products/${params.slug}`).catch(
    () => null
  );
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `${product.name} — ANILLIÉA`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt || product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await serverFetch<ProductDetail>(`/api/products/${params.slug}`).catch(
    () => null
  );
  if (!product) notFound();

  const reviewsData = await serverFetch<Paginated<Review>>(
    `/api/reviews?productId=${product.id}`
  ).catch(
    () =>
      ({ items: [], page: 1, limit: 12, total: 0, totalPages: 0 }) as Paginated<Review>
  );
  const reviews = (reviewsData.items ?? []).map(toDisplayReview);

  const summary = product.reviewSummary ?? { count: 0, average: null };
  const avgRating = summary.average ?? 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "ANILLIÉA" },
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "PKR",
      price: product.price,
      availability: (product.available ?? 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(summary.count > 0 && summary.average != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: summary.average,
            reviewCount: summary.count,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />

      <div className="container-x">
        <Breadcrumbs
          trail={[
            { label: "Shop", href: "/shop" },
            ...(product.category
              ? [{ label: product.category.name, href: `/shop/${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="container-x grid gap-10 pb-14 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.category && (
            <p className="eyebrow mb-2">
              <Link href={`/shop/${product.category.slug}`} className="hover:text-espresso">
                {product.category.name}
              </Link>
            </p>
          )}
          <h1 className="font-serif text-4xl leading-tight text-espresso md:text-5xl">
            {product.name}
          </h1>

          <ProductPurchase product={product} />

          <div className="mt-8">
            <Accordion
              items={[
                {
                  title: "Description",
                  content: <p className="whitespace-pre-line">{product.description}</p>,
                },
                {
                  title: "Materials & Care",
                  content: (
                    <div className="space-y-3">
                      {product.material && <p className="whitespace-pre-line">{product.material}</p>}
                      {product.careInstructions && (
                        <p className="whitespace-pre-line">{product.careInstructions}</p>
                      )}
                      {!product.material && !product.careInstructions && (
                        <p>
                          Crafted from premium, breathable fabric selected for
                          all-day comfort. Gentle machine wash cold, hang dry in
                          shade, cool iron if needed.
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Shipping & Returns",
                  content: (
                    <div className="space-y-3">
                      <p>
                        Standard delivery across Pakistan in 3–5 working days
                        (PKR 250, free on orders over PKR 5,000). Express
                        delivery in 1–2 working days (PKR 450).
                      </p>
                      <p>
                        Not quite right? Return or exchange within 7 days of
                        delivery in original condition. Contact us at
                        hello@anilliea.pk to arrange.
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {product.collections.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="rounded-full border border-espresso/15 px-4 py-1.5 font-sans text-xs text-espresso-muted transition-colors hover:border-espresso hover:text-espresso"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewSection
        productId={product.id}
        initialReviews={reviews}
        summary={summary}
      />

      {product.category && (
        <RelatedProducts categorySlug={product.category.slug} excludeId={product.id} />
      )}
    </>
  );
}
