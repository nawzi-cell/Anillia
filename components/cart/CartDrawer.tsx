"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPKR } from "@/lib/api/client";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function CartItemRow({ itemId }: { itemId: string }) {
  const { cart, updateQty, removeItem } = useCart();
  const item = cart.items.find((i) => i.id === itemId);
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const image = item.product.images[0];

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/product/${item.product.slug}`}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory-dark"
      >
        {image ? (
          <Image src={image.url} alt={image.alt || item.product.name} fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center font-serif text-xs text-taupe">
            {item.product.name}
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/product/${item.product.slug}`} className="font-serif text-base leading-snug text-espresso hover:text-taupe-dark">
              {item.product.name}
            </Link>
            {item.variant && (
              <p className="mt-0.5 font-sans text-xs text-espresso-muted">
                {item.variant.name}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.product.name} from cart`}
            disabled={busy}
            onClick={() => run(() => removeItem(item.id))}
            className="rounded-full p-1.5 text-espresso-muted transition-colors hover:bg-espresso/5 hover:text-espresso disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantitySelector
            small
            value={item.quantity}
            onChange={(qty) => run(() => updateQty(item.id, qty))}
          />
          <p className="font-sans text-sm font-semibold text-espresso">
            {busy ? <Spinner size="sm" /> : formatPKR(item.subtotal)}
          </p>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, loading } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-espresso/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-[61] flex w-[92vw] max-w-md flex-col bg-ivory"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-espresso/10 px-6 py-5">
              <h2 className="font-serif text-xl text-espresso">
                Your Bag {cart.items.length > 0 && `(${cart.items.reduce((s, i) => s + i.quantity, 0)})`}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="rounded-full p-2 text-espresso hover:bg-espresso/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner />
                </div>
              ) : cart.items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <p className="font-serif text-xl text-espresso">Your bag is empty</p>
                  <p className="mt-2 font-sans text-sm text-espresso-muted">
                    Beautiful modest essentials are waiting.
                  </p>
                  <Link href="/shop" onClick={onClose} className="mt-6">
                    <Button size="sm">Start shopping</Button>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-espresso/10">
                  {cart.items.map((item) => (
                    <CartItemRow key={item.id} itemId={item.id} />
                  ))}
                </ul>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="border-t border-espresso/10 px-6 py-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-sm text-espresso-muted">Subtotal</span>
                  <span className="font-sans text-base font-semibold text-espresso">
                    {formatPKR(cart.subtotal)}
                  </span>
                </div>
                <p className="mb-4 font-sans text-xs text-espresso-muted">
                  Delivery & discounts calculated at checkout.
                </p>
                <div className="flex gap-3">
                  <Link href="/cart" onClick={onClose} className="flex-1">
                    <Button variant="secondary" fullWidth size="sm">
                      View bag
                    </Button>
                  </Link>
                  <Link href="/checkout" onClick={onClose} className="flex-1">
                    <Button fullWidth size="sm">Checkout</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
