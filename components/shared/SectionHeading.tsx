import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { label: string; href: string };
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5 md:mb-12">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-taupe/70" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 className="text-balance font-serif text-4xl leading-[1.05] text-espresso md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
            {description}
          </p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="link-underline group inline-flex items-center gap-2 pb-0.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:text-taupe-dark"
        >
          {link.label}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
