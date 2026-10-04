"use client";

import { useState } from "react";
import { Check, Copy, TicketPercent } from "lucide-react";

export function CouponBanner() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("WELCOME10");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-espresso px-6 py-6 text-ivory sm:flex-row sm:px-8">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ivory/10">
          <TicketPercent className="h-5 w-5 text-taupe-light" aria-hidden />
        </span>
        <div>
          <p className="font-serif text-xl">New here? Take 10% off</p>
          <p className="font-sans text-sm text-ivory/70">
            Use this code at checkout on your first order.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy coupon code WELCOME10"
        className="flex items-center gap-2 rounded-full border border-dashed border-ivory/40 px-6 py-3 font-sans text-sm font-bold uppercase tracking-widest2 transition-colors hover:border-ivory hover:bg-ivory/10"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? "Copied!" : "WELCOME10"}
      </button>
    </div>
  );
}
