"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPKR, isAvailable, type ProductListItem } from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, moveToCart, toggle } = useWishlist();
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/wishlist")}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="container-x flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const moveOne = async (product: ProductListItem) => {
    setMovingId(product.id);
    try {
      await moveToCart(product);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Wishlist" }]} />
      <div className="mb-8 mt-2">
        <h1 className="font-serif text-4xl text-espresso md:text-5xl">Wishlist</h1>
        <p className="mt-2 font-sans text-sm text-espresso-muted">
          {items.length} saved item{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save the pieces you love and find them here, ready when you are."
          action={
            <Link href="/shop">
              <Button>Discover products</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => {
            const image = product.images[0];
            const moving = movingId === product.id;
            const available = isAvailable(product);
            return (
              <li key={product.id} className="group relative">
                <Link
                  href={`/product/${product.slug}`}
                  className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-dark"
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
                    <span className="flex h-full items-center justify-center px-4 text-center font-serif text-lg text-taupe">
                      {product.name}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(product)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 shadow-sm transition-colors hover:bg-ivory"
                >
                  <X className="h-4 w-4 text-espresso" aria-hidden />
                </button>
                <div className="mt-3 px-0.5">
                  <Link href={`/product/${product.slug}`}>
                    <h2 className="mt-1 font-serif text-lg leading-snug text-espresso">
                      {product.name}
                    </h2>
                  </Link>
                  <p className="mt-1 font-sans text-sm font-semibold text-espresso">
                    {formatPKR(product.price)}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    disabled={moving || !available}
                    onClick={() => moveOne(product)}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                    {moving ? "Moving…" : available ? "Move to bag" : "Out of stock"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
