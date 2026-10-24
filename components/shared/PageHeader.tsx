import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export function PageHeader({
  eyebrow,
  title,
  description,
  trail,
  meta,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  trail: { label: string; href?: string }[];
  meta?: ReactNode;
}) {
  return (
    <section className="grain relative overflow-hidden border-b border-espresso/10 bg-ivory-light">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(115,121,99,0.09),transparent_55%)]"
        aria-hidden
      />
      <div className="container-x relative pb-9 pt-1 md:pb-12">
        <Breadcrumbs trail={trail} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-taupe/80" aria-hidden />
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance font-serif text-5xl leading-[1.02] text-espresso md:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
                {description}
              </p>
            )}
          </div>
          {meta}
        </div>
      </div>
    </section>
  );
}
