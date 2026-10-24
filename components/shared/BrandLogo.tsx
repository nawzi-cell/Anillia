import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  /** Where the logo links to. Pass null to render without a link. */
  href?: string | null;
  /** Sizing for the badge. The badge is square; height drives the size. */
  markClassName?: string;
  /** Typography for the wordmark. */
  wordmarkClassName?: string;
  /** Light text for dark surfaces. */
  tone?: "light" | "dark";
  /** Eager-load the image (use for above-the-fold placements like the header). */
  priority?: boolean;
  className?: string;
}

/**
 * The ANILLIÉA lockup: the gold medallion beside a serif wordmark.
 * The badge artwork has a dark ground, so it is cropped to a circle and
 * framed as a deliberate seal instead of a floating black square.
 */
export function BrandLogo({
  href = "/",
  markClassName = "h-10 w-10",
  wordmarkClassName = "text-lg",
  tone = "light",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const dark = tone === "dark";

  const lockup = (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${
          dark ? "ring-1 ring-ivory/25" : "ring-1 ring-gold/40"
        } ${markClassName}`}
      >
        <Image
          src="/logo/anilliea-badge.png"
          alt=""
          width={256}
          height={256}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif uppercase tracking-[0.26em] ${
            dark ? "text-ivory" : "text-espresso"
          } ${wordmarkClassName}`}
        >
          Anilliéa
        </span>
        <span
          className={`mt-1.5 hidden font-sans text-[8px] uppercase tracking-[0.28em] sm:block ${
            dark ? "text-ivory/55" : "text-taupe-dark"
          }`}
        >
          Elegance in every detail
        </span>
      </span>
    </span>
  );

  if (href === null) {
    return <span className={`inline-flex items-center ${className}`}>{lockup}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="ANILLIÉA — Elegance in every detail"
      className={`inline-flex items-center ${className}`}
    >
      {lockup}
    </Link>
  );
}
