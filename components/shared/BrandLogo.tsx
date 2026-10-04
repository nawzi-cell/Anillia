import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  /** Where the logo links to. Pass null to render without a link. */
  href?: string | null;
  /** Sizing for the gold monogram mark. */
  markClassName?: string;
  /** Extra classes for the wordmark text. */
  wordmarkClassName?: string;
  /** "light" = on light backgrounds (espresso text), "dark" = on dark backgrounds (ivory text). */
  tone?: "light" | "dark";
  /** Eager-load the image (use for above-the-fold placements like the header). */
  priority?: boolean;
  className?: string;
}

/**
 * The ANILLIÉA brand lockup: the gold monogram extracted from the brand
 * artwork (transparent ground, no black box) paired with a serif wordmark
 * set in the site's display typeface.
 */
export function BrandLogo({
  href = "/",
  markClassName = "h-9 w-auto",
  wordmarkClassName = "text-xl",
  tone = "light",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const textColor = tone === "dark" ? "text-ivory" : "text-espresso";

  const lockup = (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/logo/anilliea-mark.png"
        alt=""
        aria-hidden
        width={344}
        height={180}
        className={`block ${markClassName}`}
        priority={priority}
      />
      <span
        className={`font-serif font-medium tracking-[0.24em] ${textColor} ${wordmarkClassName}`}
      >
        ANILLIÉA
      </span>
    </span>
  );

  if (href === null) {
    return (
      <span className={`inline-flex items-center ${className}`}>{lockup}</span>
    );
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
