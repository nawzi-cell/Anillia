"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, User, Heart } from "lucide-react";
import { NAV_LINKS } from "./Header";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-espresso/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-[61] flex w-[85vw] max-w-sm flex-col bg-ivory"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-espresso/10 px-6 py-4">
              <BrandLogo markClassName="h-8 w-auto" wordmarkClassName="text-lg" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full p-2 text-espresso hover:bg-espresso/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col px-6 py-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`block border-b border-espresso/5 py-4 font-serif text-2xl transition-colors hover:text-taupe-dark ${
                      pathname === link.href ? "text-espresso" : "text-espresso-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto px-6 pb-8">
              <div className="mb-6 flex gap-3 sm:hidden">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso/15 py-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso"
                >
                  <User className="h-4 w-4" aria-hidden />
                  Account
                </Link>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso/15 py-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso"
                >
                  <Heart className="h-4 w-4" aria-hidden />
                  Wishlist
                </Link>
              </div>
              <p className="font-sans text-xs leading-relaxed text-taupe-dark">
                Thoughtfully curated modest essentials, delivered across Pakistan.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
