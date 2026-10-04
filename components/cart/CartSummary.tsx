"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPKR } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`font-sans text-sm ${strong ? "font-semibold text-espresso" : "text-espresso-muted"}`}>
        {label}
      </span>
      <span className={`font-sans text-sm ${strong ? "font-semibold text-espresso" : "text-espresso"}`}>
        {value}
      </span>
    </div>
  );
}

export function CartSummary({ checkoutHref = "/checkout" }: { checkoutHref?: string }) {
  const { cart, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      await applyCoupon(trimmed);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeCoupon();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-espresso/10 bg-ivory-light p-6">
      <h2 className="font-serif text-xl text-espresso">Order summary</h2>

      <div className="mt-4">
        <Row label="Subtotal" value={formatPKR(cart.subtotal)} />
        {cart.discount > 0 && (
          <Row label={cart.couponCode ? `Discount (${cart.couponCode})` : "Discount"} value={`−${formatPKR(cart.discount)}`} />
        )}
        <Row label="Delivery" value={cart.delivery === 0 ? "Free" : formatPKR(cart.delivery)} />
        <div className="hairline mt-2 pt-2">
          <Row label="Total" value={formatPKR(cart.total)} strong />
        </div>
      </div>

      <div className="mt-5">
        {cart.couponCode ? (
          <div className="flex items-center justify-between rounded-lg bg-olive/10 px-4 py-3">
            <span className="font-sans text-sm font-semibold text-olive-dark">
              {cart.couponCode} applied
            </span>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="font-sans text-xs text-espresso-muted underline hover:text-espresso disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={apply}>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Coupon code"
                aria-label="Coupon code"
                disabled={busy}
              />
              <Button type="submit" variant="secondary" size="md" disabled={busy || !code.trim()}>
                {busy ? "…" : "Apply"}
              </Button>
            </div>
            {error && (
              <p className="mt-2 font-sans text-xs text-red-800" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>

      <a href={checkoutHref} className="mt-6 block">
        <Button fullWidth>Proceed to checkout</Button>
      </a>
      <p className="mt-3 text-center font-sans text-xs text-espresso-muted">
        Secure checkout · COD & bank transfer available
      </p>
    </div>
  );
}
