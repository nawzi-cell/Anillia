"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart } from "lucide-react";
import { discountPercent, formatPKR, isAvailable, type ProductListItem } from "@/lib/api/client";
import { useWishlist } from "@/hooks/useWishlist";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { toggle, isWished } = useWishlist();
  const reduceMotion = useReducedMotion();
  const wished = isWished(product.id);
  const pct = discountPercent(product.price, product.compareAtPrice ?? null);
  const image = product.images[0];
  const hoverImage = product.images[1];
  const outOfStock = !isAvailable(product);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-ivory-dark ring-1 ring-inset ring-espresso/5"
      >
        {image ? (
          <>
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              loading="lazy"
            />
            {hoverImage && (
              <Image
                src={hoverImage.url}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                loading="lazy"
              />
            )}
            {!outOfStock && (
              <span
                className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-between rounded-full bg-ivory/90 px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-widest2 text-espresso opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                aria-hidden
              >
                View piece
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ivory-dark">
            <span className="px-4 text-center font-serif text-lg text-taupe">{product.name}</span>
          </div>
        )}
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-widest2 text-ivory">
            −{pct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-espresso/75 py-2 text-center font-sans text-[10px] uppercase tracking-widest2 text-ivory">
            Out of stock
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => toggle(product)}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wished}
        className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 shadow-sm ring-1 ring-espresso/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-ivory"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${wished ? "fill-espresso text-espresso" : "text-espresso"}`}
          aria-hidden
        />
      </button>

      <div className="mt-4 px-0.5">
        {product.category && (
          <p className="font-sans text-[10px] uppercase tracking-widest2 text-taupe-dark">
            {product.category.name}
          </p>
        )}
        <Link href={`/product/${product.slug}`} className="inline-block">
          <h3 className="mt-1.5 font-serif text-xl leading-snug text-espresso transition-colors group-hover:text-taupe-dark">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-sans text-sm font-medium tracking-wide text-espresso">
            {formatPKR(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="font-sans text-xs text-taupe-dark line-through">
              {formatPKR(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
