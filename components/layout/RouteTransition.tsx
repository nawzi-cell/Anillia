"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * SPA-style route progress bar. Animates a thin espresso bar across the top
 * of the viewport while the App Router transitions between pages.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  // Every navigation (path or query change) triggers a short progress sweep.
  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]"
    >
      <AnimatePresence>
        {active && (
          <motion.div
            key={`${pathname}-${searchParams?.toString()}`}
            className="h-full origin-left bg-espresso"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * SPA-style page transition. Wraps the routed page and cross-fades + rises
 * content on every navigation, so the storefront feels like one continuous
 * app instead of discrete page loads.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
