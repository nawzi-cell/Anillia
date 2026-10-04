"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-espresso/5">
        <TriangleAlert className="h-7 w-7 text-taupe-dark" aria-hidden />
      </span>
      <p className="eyebrow mb-4 mt-6">Something went wrong</p>
      <h1 className="font-serif text-5xl text-espresso md:text-6xl">
        A small hiccup
      </h1>
      <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-espresso-muted">
        We couldn&apos;t load this page just now. Please try again — and if the
        problem persists, write to us at hello@anilliea.pk.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-espresso px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-ivory transition-colors hover:bg-espresso-light"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-espresso/25 px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:border-espresso"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
