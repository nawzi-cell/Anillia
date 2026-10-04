"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      Math.abs(p - page) <= 1
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-espresso-muted">
        Page {page} of {totalPages}
        {typeof total === "number" ? ` · ${total} records` : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-espresso/15 text-espresso-muted transition hover:border-espresso/40 hover:text-espresso disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-espresso-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium transition ${
                p === page
                  ? "bg-espresso text-ivory"
                  : "text-espresso-muted hover:bg-espresso/5 hover:text-espresso"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-espresso/15 text-espresso-muted transition hover:border-espresso/40 hover:text-espresso disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
