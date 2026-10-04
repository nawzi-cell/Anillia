import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Feather, Leaf, RotateCcw, Truck } from "lucide-react";
import {
  discountPercent,
  formatPKR,
  serverFetch,
  type Category,
  type Collection,
  type Paginated,
  type ProductDetail,
  type ProductListItem,
} from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { InstagramGrid } from "@/components/shared/InstagramGrid";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { journalPosts } from "@/content/journal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ANILLIÉA — Premium Modest Fashion & Everyday Essentials",
  description:
    "Thoughtfully curated modest essentials designed for everyday elegance. Hijabs, underscarves, accessories and curated bundles — delivered across Pakistan.",
};

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

async function getHomeData() {
  const [categories, collections, bestSellers, newArrivals, deal] =
    await Promise.all([
      serverFetch<Category[]>("/api/categories").catch(() => [] as Category[]),
      serverFetch<Collection[]>("/api/collections").catch(() => [] as Collection[]),
      serverFetch<Paginated<ProductListItem>>("/api/products?sort=popular&limit=4")
        .then((d) => d.items ?? [])
        .catch(() => [] as ProductListItem[]),
      serverFetch<Paginated<ProductListItem>>("/api/products?sort=newest&limit=4")
        .then((d) => d.items ?? [])
        .catch(() => [] as ProductListItem[]),
      serverFetch<ProductDetail>("/api/products/everyday-modest-deal").catch(
        () => null
      ),
    ]);
  return { categories, collections, bestSellers, newArrivals, deal };
}

const VALUE_PROPS = [
  {
    icon: Leaf,
    title: "Ethically curated",
    text: "Every piece is chosen with care — responsibly sourced and made to last beyond a season.",
  },
  {
    icon: Feather,
    title: "Premium fabrics",
    text: "Breathable, opaque, beautifully draping fabrics selected for all-day comfort.",
  },
  {
    icon: Truck,
    title: "Pakistan-wide delivery",
    text: "Reliable delivery to every corner of Pakistan, with cash on delivery available.",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    text: "Changed your mind? Simple, no-fuss returns within 7 days of delivery.",
  },
];

const STYLING_CARDS = [
  {
    src: "/images/styling-1.svg",
    title: "The Everyday Drape",
    text: "One hijab, three ways to wear it through a busy week.",
  },
  {
    src: "/images/styling-2.svg",
    title: "Layered for Winter",
    text: "Warmth without bulk — modest layers for cooler days.",
  },
  {
    src: "/images/styling-3.svg",
    title: "Occasion Ready",
    text: "Elevated pairings for weddings and evening gatherings.",
  },
];

export default async function HomePage() {
  const { categories, collections, bestSellers, newArrivals, deal } =
    await getHomeData();

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ANILLIÉA",
    url: siteUrl,
    logo: `${siteUrl}/logo/anilliea-logo.png`,
    description:
      "Premium modest fashion and everyday essentials, delivered across Pakistan.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Karachi",
      addressCountry: "PK",
    },
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ANILLIÉA",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />

      {/* 1 — Hero */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-4">Modest essentials · Pakistan</p>
            <h1 className="font-serif text-5xl leading-[1.05] text-espresso md:text-6xl lg:text-7xl">
              Elegance in Every Detail
            </h1>
            <p className="mt-5 max-w-md font-sans text-base leading-relaxed text-espresso-muted md:text-lg">
              Thoughtfully curated modest essentials designed for everyday
              elegance.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg">Shop Collection</Button>
              </Link>
              <Link href="/deals">
                <Button size="lg" variant="secondary">
                  Explore Deals
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-lg overflow-hidden rounded-3xl bg-ivory-dark">
              <Image
                src="/images/hero-editorial.svg"
                alt="ANILLIÉA editorial — elegant draped fabric in warm ivory tones"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — Featured deal */}
      <section aria-label="Featured deal" className="bg-espresso text-ivory">
        <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl bg-espresso-light">
              <Image
                src="/images/products/everyday-modest-deal.svg"
                alt="Everyday Modest Deal bundle"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4 !text-taupe-light">Limited time</p>
            <h2 className="font-serif text-4xl md:text-5xl">Everyday Modest Deal</h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-ivory/75">
              Our most-loved everyday essentials, bundled together at one
              gentle price. The perfect way to refresh your daily rotation.
            </p>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-4xl">
                {deal ? formatPKR(deal.price) : formatPKR(899)}
              </span>
              {deal?.compareAtPrice && deal.compareAtPrice > deal.price && (
                <>
                  <span className="font-sans text-lg text-ivory/60 line-through">
                    {formatPKR(deal.compareAtPrice)}
                  </span>
                  <Badge tone="olive">
                    Save {discountPercent(deal.price, deal.compareAtPrice)}%
                  </Badge>
                </>
              )}
            </div>
            <div className="mt-8">
              <Link href={deal ? `/product/${deal.slug}` : "/deals"}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="!border-ivory/30 !text-ivory hover:!border-ivory"
                >
                  Shop the deal
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 — Shop by category */}
      {categories.length > 0 && (
        <section aria-label="Shop by category" className="container-x py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Curated for you"
              title="Shop by Category"
              link={{ label: "View all", href: "/shop" }}
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {categories.slice(0, 4).map((cat, i) => (
              <Reveal key={cat.slug} delay={0.06 * i}>
                <Link
                  href={`/shop/${cat.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-ivory-dark"
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-ivory-dark">
                      <span className="font-serif text-xl text-taupe">{cat.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-espresso/25 transition-colors group-hover:bg-espresso/35" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-serif text-2xl text-ivory">{cat.name}</h3>
                    {cat.description && (
                      <p className="mt-1 line-clamp-2 font-sans text-xs text-ivory/80">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 4 — Best sellers */}
      {bestSellers.length > 0 && (
        <section aria-label="Best sellers" className="bg-ivory-light">
          <div className="container-x py-16 md:py-20">
            <Reveal>
              <SectionHeading
                eyebrow="Loved by many"
                title="Best Sellers"
                link={{ label: "View all", href: "/shop?sort=popular" }}
              />
            </Reveal>
            <ProductGrid products={bestSellers} />
          </div>
        </section>
      )}

      {/* 5 — New arrivals */}
      {newArrivals.length > 0 && (
        <section aria-label="New arrivals" className="container-x py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Just landed"
              title="New Arrivals"
              link={{ label: "View all", href: "/shop?sort=newest" }}
            />
          </Reveal>
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* 6 — Collections */}
      {collections.length > 0 && (
        <section aria-label="Collections" className="container-x pb-16 md:pb-20">
          <Reveal>
            <SectionHeading
              eyebrow="Edit"
              title="Curated Collections"
              link={{ label: "All collections", href: "/collections" }}
            />
          </Reveal>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {collections.slice(0, 3).map((col, i) => (
              <Reveal key={col.slug} delay={0.06 * i}>
                <Link
                  href={`/collections/${col.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-ivory-dark"
                >
                  {col.image ? (
                    <Image
                      src={col.image}
                      alt={col.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-serif text-2xl text-taupe">{col.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-espresso/25 transition-colors group-hover:bg-espresso/35" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-serif text-2xl text-ivory md:text-3xl">{col.name}</h3>
                    {col.description && (
                      <p className="mt-1 line-clamp-2 font-sans text-sm text-ivory/80">
                        {col.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 7 — Brand story */}
      <section aria-label="Our story" className="bg-ivory-light">
        <div className="container-x grid items-center gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ivory-dark">
              <Image
                src="/images/brand-story.svg"
                alt="The ANILLIÉA atelier — fabric and craft"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4">Our story</p>
            <h2 className="font-serif text-4xl text-espresso md:text-5xl">
              Modesty, made modern
            </h2>
            <p className="mt-5 font-sans text-base leading-relaxed text-espresso-muted">
              ANILLIÉA began with a simple observation: modest dressing
              deserves the same thoughtfulness as any other kind of dressing.
              We curate a small, considered range of hijabs, underscarves and
              accessories — each chosen for its fabric, its drape, and the way
              it makes you feel wearing it.
            </p>
            <p className="mt-4 font-sans text-base leading-relaxed text-espresso-muted">
              No noise, no excess. Just quiet, everyday luxury, delivered to
              your doorstep anywhere in Pakistan.
            </p>
            <Link
              href="/about"
              className="group mt-7 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:text-taupe-dark"
            >
              Read our story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 8 — Why ANILLIÉA */}
      <section aria-label="Why ANILLIÉA" className="container-x py-16 md:py-20">
        <Reveal>
          <SectionHeading eyebrow="The ANILLIÉA promise" title="Why ANILLIÉA" />
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop, i) => (
            <Reveal key={prop.title} delay={0.06 * i}>
              <div className="text-center sm:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-olive/10 sm:mx-0">
                  <prop.icon className="h-5 w-5 text-olive-dark" aria-hidden />
                </div>
                <h3 className="mt-4 font-serif text-xl text-espresso">{prop.title}</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-espresso-muted">
                  {prop.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9 — Styling inspiration */}
      <section aria-label="Styling inspiration" className="bg-ivory-light">
        <div className="container-x py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Editorial"
              title="Styling Inspiration"
              description="Notes on drape, layering and quiet confidence — from our stylists."
            />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {STYLING_CARDS.map((card, i) => (
              <Reveal key={card.title} delay={0.06 * i}>
                <article className="overflow-hidden rounded-2xl border border-espresso/10 bg-ivory">
                  <div className="relative aspect-[4/3] bg-ivory-dark">
                    <Image
                      src={card.src}
                      alt={card.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-espresso">{card.title}</h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-espresso-muted">
                      {card.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10 — Journal */}
      <section aria-label="Journal" className="container-x py-16 md:py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Notes"
            title="From the Journal"
            link={{ label: "All articles", href: "/journal" }}
          />
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {journalPosts.map((post, i) => (
            <Reveal key={post.slug} delay={0.06 * i}>
              <Link href={`/journal/${post.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ivory-dark">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="mt-4 font-sans text-xs uppercase tracking-widest2 text-taupe-dark">
                  {new Date(post.date + "T00:00:00").toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-snug text-espresso transition-colors group-hover:text-taupe-dark">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-espresso-muted">
                  {post.excerpt}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 11 — Newsletter CTA */}
      <section aria-label="Newsletter" className="bg-olive text-ivory">
        <div className="container-x max-w-2xl py-16 text-center md:py-20">
          <Reveal>
            <p className="eyebrow mb-4 !text-ivory/80">The ANILLIÉA letter</p>
            <h2 className="font-serif text-4xl md:text-5xl">
              Quiet notes, monthly
            </h2>
            <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ivory/80">
              New arrivals, styling notes and private offers — once or twice a
              month, never more.
            </p>
            <NewsletterForm dark className="mx-auto mt-8 max-w-md" />
          </Reveal>
        </div>
      </section>

      {/* 12 — Instagram grid */}
      <InstagramGrid />
    </>
  );
}
