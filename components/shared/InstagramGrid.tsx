import Image from "next/image";
import { Instagram } from "lucide-react";

const TILES = [
  { src: "/images/styling-1.webp", alt: "Sage silk hijab draped over travertine" },
  { src: "/images/products/aurelia-silk-scarf.webp", alt: "Aurelia silk scarf detail" },
  { src: "/images/styling-3.webp", alt: "Champagne silk, pearls and gold chain" },
  { src: "/images/products/souveraine-watch.webp", alt: "Souveraine watch detail" },
  { src: "/images/styling-2.webp", alt: "Layered ivory, camel and olive knit textures" },
  { src: "/images/products/noir-elegance-handbag.webp", alt: "Noir elegance handbag" },
];

/**
 * Decorative Instagram-style grid. The handle is shown as plain text —
 * no fake links.
 */
export function InstagramGrid() {
  return (
    <section aria-label="ANILLIÉA on Instagram" className="container-x py-16 md:py-24">
      <div className="mb-9 text-center">
        <p className="eyebrow flex items-center justify-center gap-2">
          <Instagram className="h-3.5 w-3.5" aria-hidden />
          Follow along
        </p>
        <p className="mt-3 font-serif text-4xl text-espresso">@anilliea</p>
        <p className="mx-auto mt-2 max-w-sm font-sans text-sm text-espresso-muted">
          Everyday moments, quiet textures and new arrivals.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {TILES.map((tile) => (
          <div
            key={tile.src}
            className="group relative aspect-square overflow-hidden rounded-xl bg-ivory-dark ring-1 ring-inset ring-espresso/5"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex items-center justify-center bg-espresso/0 transition-colors duration-300 group-hover:bg-espresso/25"
              aria-hidden
            >
              <Instagram className="h-5 w-5 translate-y-1 text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
