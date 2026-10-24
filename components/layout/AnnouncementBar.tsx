import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="border-b border-gold/20 bg-espresso text-ivory">
      <div className="container-x flex h-9 items-center justify-between gap-4">
        <p className="hidden font-sans text-[10px] uppercase tracking-widest2 text-ivory/55 md:block">
          Karachi · Pakistan
        </p>
        <p className="flex min-w-0 items-center justify-center gap-2 font-sans text-[10px] font-medium uppercase tracking-widest2 sm:text-[11px]">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold-light" aria-hidden />
          <span className="truncate">
            Complimentary delivery over PKR 5,000
            <span className="hidden sm:inline">
              <span className="mx-2 text-gold-light/70" aria-hidden>
                ·
              </span>
              COD available
            </span>
          </span>
        </p>
        <Link
          href="/contact"
          className="link-underline hidden font-sans text-[10px] uppercase tracking-widest2 text-ivory/55 transition-colors hover:text-ivory md:block"
        >
          Concierge
        </Link>
      </div>
    </div>
  );
}
