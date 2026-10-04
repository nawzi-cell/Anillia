import type { ReactNode } from "react";

interface AdminCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function AdminCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: AdminCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-espresso/10 bg-ivory-light shadow-[0_1px_3px_rgba(42,37,33,0.06)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso/10 px-5 py-4">
          <div>
            {title && (
              <h2 className="font-serif text-xl font-semibold text-espresso">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-espresso-muted">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`px-5 py-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
