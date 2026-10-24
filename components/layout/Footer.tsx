import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { BrandLogo } from "@/components/shared/BrandLogo";

const SHOP_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Deals", href: "/deals" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=popular" },
];

const HELP_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "About ANILLIÉA", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Track Your Order", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
];

export function Footer() {
  return (
    <footer className="grain relative bg-espresso text-ivory">
      <div
        className="h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
        aria-hidden
      />
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.3fr] lg:gap-10">
        <div>
          <BrandLogo
            tone="dark"
            markClassName="h-12 w-12"
            wordmarkClassName="text-2xl"
          />
          <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-ivory/70">
            Thoughtfully curated modest essentials designed for everyday
            elegance — delivered across Pakistan.
          </p>
          <div className="mt-6 space-y-2.5 font-sans text-sm text-ivory/70">
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              Karachi, Pakistan
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              +92 21 3456 7890
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              hello@anilliea.pk
            </p>
          </div>
        </div>

        <nav aria-label="Shop">
          <h3 className="font-sans text-[10px] font-semibold uppercase tracking-widest3 text-gold-light/80">
            Shop
          </h3>
          <ul className="mt-5 space-y-3">
            {SHOP_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  className="link-underline font-sans text-sm text-ivory/70 transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h3 className="font-sans text-[10px] font-semibold uppercase tracking-widest3 text-gold-light/80">
            Help
          </h3>
          <ul className="mt-5 space-y-3">
            {HELP_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  className="link-underline font-sans text-sm text-ivory/70 transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-sans text-[10px] font-semibold uppercase tracking-widest3 text-gold-light/80">
            Stay in the loop
          </h3>
          <p className="mt-5 font-sans text-sm leading-relaxed text-ivory/70">
            New arrivals, styling notes and private offers — once or twice a
            month, never more.
          </p>
          <NewsletterForm dark className="mt-5" />
          <p className="mt-6 font-sans text-[10px] uppercase tracking-widest2 text-ivory/55">
            COD · Bank Transfer
          </p>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
          <p className="font-sans text-xs text-ivory/55">
            © {new Date().getFullYear()} ANILLIÉA. All rights reserved.
          </p>
          <p className="font-serif text-base italic text-ivory/60">
            Elegance in every detail.
          </p>
          <p className="font-sans text-xs text-ivory/55">
            Designed in Karachi · Delivered across Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
