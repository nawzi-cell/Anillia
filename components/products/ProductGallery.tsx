"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ProductImage } from "@/lib/api/client";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-ivory-dark">
        <span className="px-6 text-center font-serif text-xl text-taupe">{name}</span>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        key={current.url}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-dark"
      >
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          priority
        />
      </motion.div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ivory-dark transition-all ${
                active === i ? "ring-2 ring-espresso ring-offset-2 ring-offset-ivory" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${name} thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
