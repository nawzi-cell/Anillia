"use client";

import { Check } from "lucide-react";

export const CHECKOUT_STEPS = [
  "Information",
  "Address",
  "Delivery",
  "Payment",
  "Review",
] as const;

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Checkout steps">
      {CHECKOUT_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-1 sm:gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-xs font-semibold transition-colors ${
                done
                  ? "bg-olive text-ivory"
                  : active
                    ? "bg-espresso text-ivory"
                    : "bg-espresso/10 text-espresso-muted"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={`hidden font-sans text-xs sm:block ${
                active ? "font-semibold text-espresso" : "text-espresso-muted"
              }`}
            >
              {label}
            </span>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className={`h-px flex-1 ${done ? "bg-olive" : "bg-espresso/15"}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
