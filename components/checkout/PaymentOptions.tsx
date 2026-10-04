"use client";

import { Banknote, Landmark, CreditCard } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

export type PaymentMethod = "COD" | "BANK_TRANSFER" | "ONLINE";

export function PaymentOptions({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}) {
  const options = [
    {
      id: "COD" as PaymentMethod,
      label: "Cash on Delivery",
      detail: "Pay in cash when your order arrives",
      icon: Banknote,
      disabled: false,
    },
    {
      id: "BANK_TRANSFER" as PaymentMethod,
      label: "Bank Transfer",
      detail: "Transfer after placing your order — details shared on confirmation",
      icon: Landmark,
      disabled: false,
    },
    {
      id: "ONLINE" as PaymentMethod,
      label: "Online Payment",
      detail: "Cards & mobile wallets — coming soon",
      icon: CreditCard,
      disabled: true,
    },
  ];

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
      {options.map((opt) => {
        const active = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={opt.disabled}
            disabled={opt.disabled}
            onClick={() => onChange(opt.id)}
            className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-colors ${
              opt.disabled
                ? "cursor-not-allowed border-espresso/10 opacity-55"
                : active
                  ? "border-espresso bg-ivory-light"
                  : "border-espresso/15 hover:border-espresso/40"
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${active ? "bg-espresso text-ivory" : "bg-espresso/5 text-espresso"}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-sans text-sm font-semibold text-espresso">
                {opt.label}
                {opt.disabled && (
                  <span className="ml-2 rounded-full bg-espresso/10 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-widest2 text-espresso-muted">
                    Coming soon
                  </span>
                )}
              </span>
              <span className="block font-sans text-xs text-espresso-muted">{opt.detail}</span>
            </span>
          </button>
        );
      })}
      {value === "BANK_TRANSFER" && (
        <Alert tone="info">
          After placing your order, our team will share ANILLIÉA&apos;s bank
          account details by email/SMS. Your order ships once the transfer is
          confirmed.
        </Alert>
      )}
    </div>
  );
}
