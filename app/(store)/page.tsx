import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Feather,
  Leaf,
  RotateCcw,
  Truck,
} from "lucide-react";
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
import { categoryImage, collectionImage } from "@/lib/imagery";
import { getPublishedJournalPosts } from "@/lib/journal/articles";

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
    src: "/images/styling-1.webp",
    title: "The Everyday Drape",
    text: "One hijab, three ways to wear it through a busy week.",
    label: "Everyday",
  },
  {
    src: "/images/styling-2.webp",
    title: "Layered for Winter",
    text: "Warmth without bulk — modest layers for cooler days.",
    label: "Layering",
  },
  {
    src: "/images/styling-3.webp",
    title: "Occasion Ready",
    text: "Elevated pairings for weddings and evening gatherings.",
    label: "Occasion",
  },
];

const MARQUEE_ITEMS = [
  "Considered fabrics",
  "Everyday elegance",
  "Cash on delivery",
  "Pakistan-wide delivery",
  "Easy 7-day returns",
];

export default async function HomePage() {
  const { categories, collections, bestSellers, newArrivals, deal } =
    await getHomeData();
  const journalPosts = (await getPublishedJournalPosts()).slice(0, 3);

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
      <section className="relative overflow-hidden bg-gradient-to-b from-ivory-light via-ivory to-ivory">
        <div
          className="pointer-events-none absolute -right-32 -top-24 h-[34rem] w-[34rem] rounded-full bg-olive/[0.09] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-taupe/10 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-6 top-1/2 hidden -translate-y-1/2 select-none font-serif text-[22rem] leading-none text-espresso/[0.035] lg:block"
          aria-hidden
        >
          A
        </span>

        <div className="container-x relative grid items-center gap-14 py-12 md:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:py-20">
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-9 bg-taupe/80" aria-hidden />
              Modest essentials · Pakistan
            </p>
            <h1 className="mt-6 max-w-xl text-balance font-serif text-[3.35rem] leading-[0.94] tracking-[-0.015em] text-espresso sm:text-6xl md:text-[4.5rem] lg:text-[5.1rem]">
              Elegance in <em className="text-olive-dark">every</em> detail
            </h1>
            <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-espresso-muted md:text-[17px]">
              Thoughtfully curated modest essentials designed for everyday
              elegance — considered fabrics, quiet colours, and pieces made to
              live in.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg">Shop Collection</Button>
              </Link>
              <Link href="/deals">
                <Button size="lg" variant="secondary">
                  Explore Deals
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-espresso/10 pt-5 font-sans text-[10px] uppercase tracking-widest2 text-espresso-muted">
              <span className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-olive-dark" aria-hidden />
                Cash on delivery
              </span>
              <span className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-olive-dark" aria-hidden />
                7-day returns
              </span>
              <span className="flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-olive-dark" aria-hidden />
                Considered fabrics
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mx-auto w-full max-w-[29rem] lg:mr-2">
              <div
                className="absolute -inset-3 hidden rounded-[2.6rem] border border-gold/30 sm:block"
                aria-hidden
              />
              <div
                className="absolute -right-6 -top-6 hidden h-28 w-28 rounded-full border border-olive/20 lg:block"
                aria-hidden
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-ivory-dark shadow-soft">
                <Image
                  src="/images/hero-editorial.webp"
                  alt="Layers of sage, taupe and ivory silk drapery in soft window light"
                  fill
                  sizes="(max-width: 1024px) 90vw, 46vw"
                  className="object-cover"
                  priority
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-espresso/35 via-espresso/5 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl border border-ivory/40 bg-ivory/90 p-4 shadow-sm backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5">
                  <div>
                    <p className="eyebrow !text-[9px]">The new edit</p>
                    <p className="mt-1.5 font-serif text-xl leading-tight text-espresso sm:text-2xl">
                      Everyday essentials
                    </p>
                  </div>
                  <Link
                    href="/shop?sort=newest"
                    aria-label="Shop the new edit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-espresso text-ivory transition-colors hover:bg-olive-dark"
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — Moving brand strip */}
      <div className="marquee overflow-hidden border-y border-espresso/10 bg-ivory-light">
        <div className="flex w-max animate-marquee items-center py-3.5" aria-hidden>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {MARQUEE_ITEMS.map((item) => (
                <span
                  key={`${copy}-${item}`}
                  className="flex items-center gap-6 px-6 font-sans text-[10px] uppercase tracking-widest3 text-espresso-muted"
                >
                  {item}
                  <span className="h-1 w-1 rotate-45 bg-gold/70" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 3 — Featured deal */}
      <section aria-label="Featured deal" className="grain relative overflow-hidden bg-espresso text-ivory">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(184,152,95,0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="container-x relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[26rem]">
              <div
                className="absolute -inset-3 rounded-t-[14rem] rounded-b-[2rem] border border-ivory/15"
                aria-hidden
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-[13rem] rounded-b-[2rem] bg-espresso-light">
                <Image
                  src="/images/products/everyday-modest-deal.webp"
                  alt="Everyday Modest Deal bundle"
                  fill
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-espresso/35 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-ivory/20 bg-espresso px-5 py-2 font-sans text-[10px] uppercase tracking-widest3 text-ivory/75 shadow-lg">
                The everyday bundle
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow flex items-center gap-3 !text-taupe-light">
              <span className="h-px w-9 bg-ivory/25" aria-hidden />
              Limited time
            </p>
            <h2 className="mt-5 text-balance font-serif text-4xl leading-[1.03] md:text-5xl lg:text-6xl">
              Everyday <em className="text-gold-light">Modest</em> Deal
            </h2>
            <p className="mt-5 max-w-md font-sans text-base leading-relaxed text-ivory/75">
              Our most-loved everyday essentials, bundled together at one
              gentle price. The perfect way to refresh your daily rotation.
            </p>
            <div className="mt-7 flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-4xl md:text-5xl">
                {deal ? formatPKR(deal.price) : formatPKR(899)}
              </span>
              {deal?.compareAtPrice && deal.compareAtPrice > deal.price && (
                <>
                  <span className="font-sans text-lg text-ivory/55 line-through">
                    {formatPKR(deal.compareAtPrice)}
                  </span>
                  <Badge tone="olive" className="!bg-gold/15 !text-gold-light">
                    Save {discountPercent(deal.price, deal.compareAtPrice)}%
                  </Badge>
                </>
              )}
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link href={deal ? `/product/${deal.slug}` : "/deals"}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="!border-ivory/30 !bg-ivory !text-espresso hover:!border-ivory hover:!bg-ivory"
                >
                  Shop the deal
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link
                href="/deals"
                className="link-underline font-sans text-[11px] font-semibold uppercase tracking-widest2 text-ivory/65 transition-colors hover:text-ivory"
              >
                All offers
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 — Shop by category */}
      {categories.length > 0 && (
        <section aria-label="Shop by category" className="container-x py-16 md:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Curated for you"
              title="Shop by Category"
              link={{ label: "View all", href: "/shop" }}
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {categories.slice(0, 4).map((cat, i) => (
              <Reveal key={cat.slug} delay={0.06 * i}>
                <Link
                  href={`/shop/${cat.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-[1.35rem] bg-ivory-dark ring-1 ring-inset ring-espresso/5"
                >
                  {categoryImage(cat.slug, cat.image) ? (
                    <Image
                      src={categoryImage(cat.slug, cat.image)!}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-ivory-dark via-taupe/30 to-olive/30">
                      <span className="font-serif text-xl text-espresso">{cat.name}</span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-espresso/5 transition-colors duration-500 group-hover:from-espresso/95"
                    aria-hidden
                  />
                  <span className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full border border-ivory/30 text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="font-sans text-[9px] uppercase tracking-widest2 text-ivory/60">
                      0{i + 1}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl text-ivory">{cat.name}</h3>
                    {cat.description && (
                      <p className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-ivory/75">
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

      {/* 5 — Best sellers */}
      {bestSellers.length > 0 && (
        <section aria-label="Best sellers" className="relative overflow-hidden bg-ivory-light">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(115,121,99,0.07),transparent_55%)]"
            aria-hidden
          />
          <div className="container-x relative py-16 md:py-24">
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

      {/* 6 — New arrivals */}
      {newArrivals.length > 0 && (
        <section aria-label="New arrivals" className="container-x py-16 md:py-24">
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

      {/* 7 — Collections */}
      {collections.length > 0 && (
        <section aria-label="Collections" className="container-x pb-16 md:pb-24">
          <Reveal>
            <SectionHeading
              eyebrow="Edit"
              title="Curated Collections"
              link={{ label: "All collections", href: "/collections" }}
            />
          </Reveal>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {collections.slice(0, 3).map((col, i) => (
              <Reveal key={col.slug} delay={0.06 * i}>
                <Link
                  href={`/collections/${col.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-ivory-dark ring-1 ring-inset ring-espresso/5"
                >
                  {collectionImage(col.slug, col.image) ? (
                    <Image
                      src={collectionImage(col.slug, col.image)!}
                      alt={col.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-ivory-dark to-taupe/40">
                      <span className="font-serif text-2xl text-espresso">{col.name}</span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/25 to-espresso/5 transition-colors duration-500 group-hover:from-espresso/95"
                    aria-hidden
                  />
                  <span className="absolute right-5 top-5 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full border border-ivory/30 text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-sans text-[9px] uppercase tracking-widest2 text-ivory/60">
                      0{i + 1} — Edit
                    </p>
                    <h3 className="mt-1.5 font-serif text-3xl text-ivory md:text-[2rem]">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-ivory/75">
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

      {/* 8 — Brand story */}
      <section aria-label="Our story" className="relative overflow-hidden bg-ivory-light">
        <div className="container-x grid items-center gap-14 py-16 md:py-24 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative mx-auto max-w-[32rem] lg:mr-auto">
              <div
                className="absolute -inset-3 rounded-[2.4rem] border border-espresso/10"
                aria-hidden
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-ivory-dark shadow-soft">
                <Image
                  src="/images/brand-story.webp"
                  alt="Folded ivory, sage and taupe fabrics with gold pins in the ANILLIÉA atelier"
                  fill
                  sizes="(max-width: 1024px) 90vw, 46vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-8 -right-3 max-w-[15rem] rounded-2xl border border-espresso/10 bg-ivory p-5 shadow-lift sm:-right-6">
                <p className="font-serif text-xl italic leading-snug text-espresso">
                  “No noise, no excess.”
                </p>
                <p className="eyebrow mt-3 !text-[9px]">The ANILLIÉA atelier</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-9 bg-taupe/80" aria-hidden />
              Our story
            </p>
            <h2 className="mt-5 text-balance font-serif text-4xl leading-[1.04] text-espresso md:text-5xl">
              Modesty, <em className="text-olive-dark">made modern</em>
            </h2>
            <p className="mt-6 font-sans text-base leading-relaxed text-espresso-muted">
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
              className="link-underline group mt-8 inline-flex items-center gap-2 pb-0.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:text-taupe-dark"
            >
              Read our story
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 9 — Why ANILLIÉA */}
      <section aria-label="Why ANILLIÉA" className="container-x py-16 md:py-24">
        <Reveal>
          <SectionHeading eyebrow="The ANILLIÉA promise" title="Why ANILLIÉA" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {VALUE_PROPS.map((prop, i) => (
            <Reveal key={prop.title} delay={0.06 * i} className="h-full">
              <div className="group relative h-full rounded-[1.35rem] border border-espresso/10 bg-ivory-light/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-espresso/20 hover:bg-ivory-light hover:shadow-lift">
                <span className="absolute right-5 top-5 font-serif text-2xl italic text-taupe/50 transition-colors group-hover:text-gold-dark">
                  0{i + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-olive/20 bg-olive/[0.08]">
                  <prop.icon className="h-[18px] w-[18px] text-olive-dark" aria-hidden />
                </div>
                <h3 className="mt-6 font-serif text-2xl text-espresso">{prop.title}</h3>
                <p className="mt-2.5 font-sans text-sm leading-relaxed text-espresso-muted">
                  {prop.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 10 — Styling inspiration */}
      <section aria-label="Styling inspiration" className="bg-ivory-light">
        <div className="container-x py-16 md:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Editorial"
              title="Styling Inspiration"
              description="Notes on drape, layering and quiet confidence — from our stylists."
            />
          </Reveal>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {STYLING_CARDS.map((card, i) => (
              <Reveal key={card.title} delay={0.06 * i}>
                <article className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-espresso ring-1 ring-inset ring-espresso/5">
                  <Image
                    src={card.src}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/25 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-sans text-[9px] uppercase tracking-widest3 text-ivory/60">
                      0{i + 1} — {card.label}
                    </p>
                    <h3 className="mt-2 font-serif text-3xl text-ivory">{card.title}</h3>
                    <p className="mt-2 max-w-xs font-sans text-sm leading-relaxed text-ivory/75">
                      {card.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — Journal */}
      <section aria-label="Journal" className="container-x py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Notes"
            title="From the Journal"
            link={{ label: "All articles", href: "/journal" }}
          />
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {journalPosts[0] && (
            <Reveal className="lg:col-span-7">
              <Link href={`/journal/${journalPosts[0].slug}`} className="group block h-full">
                <div className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem] bg-ivory-dark ring-1 ring-inset ring-espresso/5">
                  <Image
                    src={journalPosts[0].image}
                    alt={journalPosts[0].title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <p className="mt-5 font-sans text-[10px] uppercase tracking-widest2 text-taupe-dark">
                  {new Date(journalPosts[0].date + "T00:00:00").toLocaleDateString(
                    "en-PK",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </p>
                <h3 className="mt-2 max-w-xl font-serif text-3xl leading-tight text-espresso transition-colors group-hover:text-taupe-dark md:text-4xl">
                  {journalPosts[0].title}
                </h3>
                <p className="mt-3 max-w-xl line-clamp-2 font-sans text-sm leading-relaxed text-espresso-muted">
                  {journalPosts[0].excerpt}
                </p>
              </Link>
            </Reveal>
          )}
          <div className="flex flex-col gap-6 lg:col-span-5 lg:gap-7">
            {journalPosts.slice(1, 3).map((post, i) => (
              <Reveal key={post.slug} delay={0.06 * i} className="flex-1">
                <Link
                  href={`/journal/${post.slug}`}
                  className="group grid h-full grid-cols-[7.5rem_1fr] items-center gap-4 rounded-[1.35rem] border border-espresso/10 bg-ivory-light/50 p-3 transition-colors hover:bg-ivory-light sm:grid-cols-[9rem_1fr] sm:gap-5"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-ivory-dark">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="144px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="font-sans text-[9px] uppercase tracking-widest2 text-taupe-dark">
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="mt-1.5 font-serif text-xl leading-snug text-espresso transition-colors group-hover:text-taupe-dark sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 font-sans text-xs leading-relaxed text-espresso-muted">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 12 — Newsletter CTA */}
      <section aria-label="Newsletter" className="grain relative overflow-hidden bg-olive-dark text-ivory">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(216,196,155,0.16),transparent_60%)]"
          aria-hidden
        />
        <div className="container-x relative max-w-2xl py-16 text-center md:py-24">
          <Reveal>
            <span className="mx-auto mb-7 block h-px w-14 bg-ivory/35" aria-hidden />
            <p className="eyebrow mb-4 !text-ivory/80">The ANILLIÉA letter</p>
            <h2 className="text-balance font-serif text-4xl leading-[1.05] md:text-5xl">
              Quiet notes, <em className="text-gold-light">monthly</em>
            </h2>
            <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ivory/80">
              New arrivals, styling notes and private offers — once or twice a
              month, never more.
            </p>
            <NewsletterForm dark className="mx-auto mt-8 max-w-md" />
            <p className="mt-4 font-sans text-[10px] uppercase tracking-widest2 text-ivory/55">
              No noise. Unsubscribe anytime.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 13 — Instagram grid */}
      <InstagramGrid />
    </>
  );
}
