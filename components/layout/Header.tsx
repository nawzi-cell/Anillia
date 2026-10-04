"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { MobileNav } from "./MobileNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { BrandLogo } from "@/components/shared/BrandLogo";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Deals", href: "/deals" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  const iconBtn =
    "relative rounded-full p-2 text-espresso transition-colors hover:bg-espresso/5";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-espresso/10 bg-ivory/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
          {/* Left: mobile menu + wordmark */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className={`${iconBtn} lg:hidden`}
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo
              priority
              markClassName="h-7 w-auto sm:h-9 lg:h-10"
              wordmarkClassName="text-base sm:text-xl lg:text-2xl"
            />
          </div>

          {/* Center: desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-[13px] font-medium uppercase tracking-widest2 transition-colors hover:text-taupe-dark ${
                  pathname === link.href ? "text-espresso" : "text-espresso-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label={searchOpen ? "Close search" : "Search"}
              onClick={() => setSearchOpen((v) => !v)}
              className={iconBtn}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <Link
              href="/account"
              aria-label="Account"
              className={`${iconBtn} hidden sm:inline-flex`}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className={`${iconBtn} hidden sm:inline-flex`}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-olive px-1 font-sans text-[10px] font-bold text-ivory">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => setCartOpen(true)}
              className={iconBtn}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-espresso px-1 font-sans text-[10px] font-bold text-ivory">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanding search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-espresso/10"
            >
              <form onSubmit={submitSearch} className="container-x flex items-center gap-3 py-3">
                <Search className="h-4 w-4 shrink-0 text-espresso-muted" aria-hidden />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search hijabs, underscarves, bundles…"
                  aria-label="Search products"
                  className="w-full bg-transparent font-sans text-sm text-espresso placeholder:text-taupe focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso hover:text-taupe-dark"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
