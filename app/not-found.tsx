import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-espresso/5">
        <Compass className="h-7 w-7 text-taupe-dark" aria-hidden />
      </span>
      <p className="eyebrow mb-4 mt-6">404</p>
      <h1 className="font-serif text-5xl text-espresso md:text-6xl">
        This page wandered off
      </h1>
      <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-espresso-muted">
        The page you are looking for doesn&apos;t exist or has moved. Let&apos;s
        get you back to something beautiful.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-espresso px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-ivory transition-colors hover:bg-espresso-light"
        >
          Back home
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full border border-espresso/25 px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:border-espresso"
        >
          Shop all
        </Link>
      </div>
    </div>
  );
}
