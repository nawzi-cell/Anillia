"use client";

import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatPKR } from "@/lib/api/client";

export function OrderSummary() {
  const { cart } = useCart();

  return (
    <div className="rounded-2xl border border-espresso/10 bg-ivory-light p-6 lg:sticky lg:top-28">
      <h2 className="font-serif text-xl text-espresso">Order summary</h2>
      <ul className="mt-4 max-h-80 space-y-4 overflow-y-auto">
        {cart.items.map((item) => {
          const image = item.product.images[0];
          return (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                {image ? (
                  <Image src={image.url} alt={image.alt || item.product.name} fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center font-serif text-[10px] text-taupe">
                    {item.product.name}
                  </span>
                )}
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-espresso px-1 font-sans text-[10px] font-bold text-ivory">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-medium text-espresso">{item.product.name}</p>
                {item.variant && (
                  <p className="font-sans text-xs text-espresso-muted">
                    {item.variant.name}
                  </p>
                )}
              </div>
              <p className="font-sans text-sm font-semibold text-espresso">{formatPKR(item.subtotal)}</p>
            </li>
          );
        })}
      </ul>
      <div className="hairline mt-4 space-y-1.5 pt-4">
        <div className="flex justify-between font-sans text-sm">
          <span className="text-espresso-muted">Subtotal</span>
          <span className="text-espresso">{formatPKR(cart.subtotal)}</span>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between font-sans text-sm">
            <span className="text-espresso-muted">
              Discount{cart.couponCode ? ` (${cart.couponCode})` : ""}
            </span>
            <span className="text-olive-dark">−{formatPKR(cart.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-sans text-sm">
          <span className="text-espresso-muted">Delivery</span>
          <span className="text-espresso">
            {cart.delivery === 0 ? "Free" : formatPKR(cart.delivery)}
          </span>
        </div>
        <div className="flex justify-between pt-2 font-sans text-base font-semibold text-espresso">
          <span>Total</span>
          <span>{formatPKR(cart.total)}</span>
        </div>
      </div>
    </div>
  );
}
