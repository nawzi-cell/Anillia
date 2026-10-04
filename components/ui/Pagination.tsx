import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Server-rendered pagination. Intentionally NOT a client component:
 * server components pass a `buildHref` function prop, which React forbids
 * sending across the server -> client boundary.
 */

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const btn =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-sans text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          aria-label="Previous page"
          className={`${btn} border border-espresso/15 text-espresso hover:border-espresso`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className={`${btn} border border-espresso/15 text-espresso hover:border-espresso`}>
            1
          </Link>
          {start > 2 && <span className="text-taupe">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? `${btn} bg-espresso text-ivory`
              : `${btn} border border-espresso/15 text-espresso hover:border-espresso`
          }
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-taupe">…</span>}
          <Link
            href={buildHref(totalPages)}
            className={`${btn} border border-espresso/15 text-espresso hover:border-espresso`}
          >
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          aria-label="Next page"
          className={`${btn} border border-espresso/15 text-espresso hover:border-espresso`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
