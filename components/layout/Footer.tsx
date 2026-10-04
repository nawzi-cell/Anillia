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
    <footer className="bg-espresso text-ivory">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo
            tone="dark"
            markClassName="h-11 w-auto"
            wordmarkClassName="text-2xl"
          />
          <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-ivory/70">
            Thoughtfully curated modest essentials designed for everyday
            elegance — delivered across Pakistan.
          </p>
          <div className="mt-6 space-y-2 font-sans text-sm text-ivory/70">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              Karachi, Pakistan
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              +92 21 3456 7890
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-taupe-light" aria-hidden />
              hello@anilliea.pk
            </p>
          </div>
        </div>

        <nav aria-label="Shop">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest2 text-taupe-light">
            Shop
          </h3>
          <ul className="mt-4 space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  className="font-sans text-sm text-ivory/70 transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest2 text-taupe-light">
            Help
          </h3>
          <ul className="mt-4 space-y-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  className="font-sans text-sm text-ivory/70 transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest2 text-taupe-light">
            Stay in the loop
          </h3>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ivory/70">
            New arrivals, styling notes and private offers — once or twice a
            month, never more.
          </p>
          <NewsletterForm dark className="mt-4" />
          <p className="mt-5 font-sans text-xs uppercase tracking-widest2 text-ivory/50">
            COD · Bank Transfer
          </p>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="font-sans text-xs text-ivory/60">
            © {new Date().getFullYear()} ANILLIÉA. All rights reserved.
          </p>
          <p className="font-sans text-xs text-ivory/60">
            Crafted with care in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
