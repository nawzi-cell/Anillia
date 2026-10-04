"use client";

import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={onChange ? "Choose rating" : `Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const starEl = (
          <Star
            className={`${dim} ${filled ? "fill-taupe-dark text-taupe-dark" : "fill-espresso/10 text-espresso/20"}`}
            aria-hidden
          />
        );
        return onChange ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            {starEl}
          </button>
        ) : (
          <span key={star}>{starEl}</span>
        );
      })}
    </div>
  );
}
