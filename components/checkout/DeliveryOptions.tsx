"use client";

import { Truck, Zap } from "lucide-react";
import { formatPKR } from "@/lib/api/client";
import {
  EXPRESS_DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
} from "@/lib/orders/pricing";

export type DeliveryMethod = "STANDARD" | "EXPRESS";

export const DELIVERY_OPTIONS: {
  id: DeliveryMethod;
  label: string;
  detail: string;
  fee: (subtotal: number) => number;
  icon: typeof Truck;
}[] = [
  {
    id: "STANDARD",
    label: "Standard Delivery",
    detail: "3–5 working days",
    fee: (subtotal) =>
      subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE,
    icon: Truck,
  },
  {
    id: "EXPRESS",
    label: "Express Delivery",
    detail: "1–2 working days",
    fee: () => EXPRESS_DELIVERY_FEE,
    icon: Zap,
  },
];

export function DeliveryOptions({
  value,
  onChange,
  subtotal,
}: {
  value: DeliveryMethod;
  onChange: (m: DeliveryMethod) => void;
  subtotal: number;
}) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
      {DELIVERY_OPTIONS.map((opt) => {
        const active = value === opt.id;
        const fee = opt.fee(subtotal);
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-colors ${
              active ? "border-espresso bg-ivory-light" : "border-espresso/15 hover:border-espresso/40"
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${active ? "bg-espresso text-ivory" : "bg-espresso/5 text-espresso"}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-sans text-sm font-semibold text-espresso">{opt.label}</span>
              <span className="block font-sans text-xs text-espresso-muted">{opt.detail}</span>
            </span>
            <span className="font-sans text-sm font-semibold text-espresso">
              {fee === 0 ? "Free" : formatPKR(fee)}
            </span>
          </button>
        );
      })}
      <p className="font-sans text-xs text-espresso-muted">
        Standard delivery is free on orders of {formatPKR(FREE_DELIVERY_THRESHOLD)} and above.
      </p>
    </div>
  );
}
