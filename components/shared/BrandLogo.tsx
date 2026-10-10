import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  /** Where the logo links to. Pass null to render without a link. */
  href?: string | null;
  /** Sizing for the badge. The badge is square; height drives the size. */
  markClassName?: string;
  /** Kept for API compatibility (badge already contains the wordmark). */
  wordmarkClassName?: string;
  /** Kept for API compatibility (badge renders identically on all tones). */
  tone?: "light" | "dark";
  /** Eager-load the image (use for above-the-fold placements like the header). */
  priority?: boolean;
  className?: string;
}

/**
 * The ANILLIÉA brand mark: the circular gold badge (monogram, wordmark and
 * tagline in one medallion) on a transparent ground.
 */
export function BrandLogo({
  href = "/",
  markClassName = "h-10 w-10",
  wordmarkClassName: _wordmarkClassName = "",
  tone: _tone = "light",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const lockup = (
    <Image
      src="/logo/anilliea-badge.png"
      alt="ANILLIÉA — Elegance in every detail"
      width={256}
      height={256}
      className={`block ${markClassName}`}
      priority={priority}
    />
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
