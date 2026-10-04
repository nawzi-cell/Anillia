"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { discountPercent, formatPKR, isAvailable, type ProductListItem } from "@/lib/api/client";
import { useWishlist } from "@/hooks/useWishlist";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { toggle, isWished } = useWishlist();
  const wished = isWished(product.id);
  const pct = discountPercent(product.price, product.compareAtPrice ?? null);
  const image = product.images[0];
  const outOfStock = !isAvailable(product);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-dark"
        aria-label={product.name}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ivory-dark">
            <span className="font-serif text-lg text-taupe">{product.name}</span>
          </div>
        )}
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest2 text-ivory">
            −{pct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-espresso/70 py-2 text-center font-sans text-xs uppercase tracking-widest2 text-ivory">
            Out of stock
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => toggle(product)}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wished}
        className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 shadow-sm transition-colors hover:bg-ivory"
      >
        <Heart
          className={`h-4 w-4 ${wished ? "fill-espresso text-espresso" : "text-espresso"}`}
          aria-hidden
        />
      </button>

      <div className="mt-3 px-0.5">
        {product.category && (
          <p className="font-sans text-[11px] uppercase tracking-widest2 text-taupe-dark">
            {product.category.name}
          </p>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3 className="mt-1 font-serif text-lg leading-snug text-espresso transition-colors group-hover:text-taupe-dark">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-sans text-sm font-semibold text-espresso">
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
