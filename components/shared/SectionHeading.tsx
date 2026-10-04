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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-serif text-3xl text-espresso md:text-4xl">{title}</h2>
        {description && (
          <p className="mt-3 font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
            {description}
          </p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso transition-colors hover:text-taupe-dark"
        >
          {link.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
