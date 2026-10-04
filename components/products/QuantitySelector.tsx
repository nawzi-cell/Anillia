"use client";

import { Minus, Plus } from "lucide-react";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  small = false,
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
}) {
  const btn = `flex items-center justify-center rounded-full text-espresso transition-colors hover:bg-espresso/5 disabled:opacity-30 ${
    small ? "h-8 w-8" : "h-10 w-10"
  }`;
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-espresso/20 ${
        small ? "p-0.5" : "p-1"
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btn}
      >
        <Minus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={`min-w-8 text-center font-sans font-semibold text-espresso ${
          small ? "text-xs" : "text-sm"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btn}
      >
        <Plus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      </button>
    </div>
  );
}
