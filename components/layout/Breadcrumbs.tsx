import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex flex-wrap items-center gap-1 font-sans text-xs text-espresso-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-espresso">
            Home
          </Link>
        </li>
        {trail.map((crumb) => (
          <li key={crumb.label} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-taupe" aria-hidden />
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-espresso">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-espresso">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
