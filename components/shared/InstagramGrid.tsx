import Image from "next/image";
import { Instagram } from "lucide-react";

const TILES = [
  { src: "/images/products/crinkle-georgette-hijab.svg", alt: "Crinkle georgette hijab styling" },
  { src: "/images/products/jersey-underscarf.svg", alt: "Jersey underscarf detail" },
  { src: "/images/styling-1.svg", alt: "Everyday modest styling" },
  { src: "/images/products/everyday-pin-set.svg", alt: "Everyday pin set" },
  { src: "/images/styling-2.svg", alt: "Layered modest look" },
  { src: "/images/products/lightweight-niqab.svg", alt: "Lightweight niqab" },
];

/**
 * Decorative Instagram-style grid. The handle is shown as plain text —
 * no fake links.
 */
export function InstagramGrid() {
  return (
    <section aria-label="ANILLIÉA on Instagram" className="container-x py-16 md:py-20">
      <div className="mb-8 text-center">
        <p className="eyebrow mb-3 flex items-center justify-center gap-2">
          <Instagram className="h-4 w-4" aria-hidden />
          Follow along
        </p>
        <p className="font-serif text-3xl text-espresso">@anilliea</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
        {TILES.map((tile) => (
          <div
            key={tile.src}
            className="group relative aspect-square overflow-hidden rounded-xl bg-ivory-dark"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
