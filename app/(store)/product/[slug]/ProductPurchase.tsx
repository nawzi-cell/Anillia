"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import {
  discountPercent,
  formatPKR,
  isAvailable,
  unitsLeft,
  type ProductDetail,
  type ProductVariant,
} from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ColorSwatch } from "@/components/products/ColorSwatch";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { StockBadge } from "@/components/products/StockBadge";

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState("");

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          (hasVariants
            ? variants.map((v) => v.color).filter(Boolean)
            : (product.colors ?? [])) as string[]
        )
      ),
    [variants, hasVariants, product.colors]
  );

  const sizes = useMemo(() => {
    if (!hasVariants) return [];
    const pool = color ? variants.filter((v) => v.color === color) : variants;
    return Array.from(new Set(pool.map((v) => v.size).filter(Boolean))) as string[];
  }, [variants, hasVariants, color]);

  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!hasVariants) return null;
    return (
      variants.find(
        (v) =>
          (color ? v.color === color : true) && (size ? v.size === size : true)
      ) ?? null
    );
  }, [variants, hasVariants, color, size]);

  const needsColor = colors.length > 0 && !color;
  const needsSize = sizes.length > 0 && !size;
  const price = selectedVariant?.price ?? product.price;
  const pct = discountPercent(price, product.compareAtPrice ?? null);
  const inStock = hasVariants
    ? selectedVariant
      ? selectedVariant.available > 0
      : variants.some((v) => v.available > 0)
    : isAvailable(product);
  const units = selectedVariant ? selectedVariant.available : unitsLeft(product);
  const wished = isWished(product.id);

  const doAdd = async (goToCheckout: boolean) => {
    setError("");
    if (!authLoading && !user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (needsColor || needsSize) {
      setError(
        `Please select ${[needsColor ? "a colour" : null, needsSize ? "a size" : null].filter(Boolean).join(" and ")} first.`
      );
      return;
    }
    if (!inStock) {
      setError("This item is currently out of stock.");
      return;
    }
    setBusy(goToCheckout ? "buy" : "cart");
    try {
      await addItem(product.id, selectedVariant?.id, qty);
      if (goToCheckout) router.push("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to bag. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {/* Price */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-serif text-4xl text-espresso">{formatPKR(price)}</span>
        {product.compareAtPrice && product.compareAtPrice > price && (
          <>
            <span className="font-sans text-lg text-taupe-dark line-through">
              {formatPKR(product.compareAtPrice)}
            </span>
            <Badge>Save {pct}%</Badge>
          </>
        )}
      </div>
      <div className="mt-3">
        <StockBadge units={units} />
      </div>

      {/* Colour */}
      {colors.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted">
            Colour{color ? `: ${color}` : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                selected={color === c}
                onSelect={() => {
                  setColor(c);
                  setSize(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted">
            Size{size ? `: ${size}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`rounded-full border px-5 py-2.5 font-sans text-sm transition-colors ${
                  size === s
                    ? "border-espresso bg-espresso text-ivory"
                    : "border-espresso/20 text-espresso hover:border-espresso"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty + Add */}
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <QuantitySelector value={qty} onChange={setQty} max={10} />
        <Button
          size="lg"
          className="flex-1"
          disabled={busy !== null || !inStock}
          onClick={() => doAdd(false)}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {busy === "cart" ? "Adding…" : "Add to Bag"}
        </Button>
        <button
          type="button"
          onClick={() => toggle(product)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-espresso/20 text-espresso transition-colors hover:border-espresso"
        >
          <Heart className={`h-5 w-5 ${wished ? "fill-espresso" : ""}`} aria-hidden />
        </button>
      </div>

      <Button
        size="lg"
        variant="secondary"
        fullWidth
        className="mt-3"
        disabled={busy !== null || !inStock}
        onClick={() => doAdd(true)}
      >
        <Zap className="h-4 w-4" aria-hidden />
        {busy === "buy" ? "Adding…" : "Buy Now"}
      </Button>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {selectedVariant?.sku && (
        <p className="mt-4 font-sans text-xs text-espresso-muted">
          SKU: {selectedVariant.sku}
        </p>
      )}
    </div>
  );
}
