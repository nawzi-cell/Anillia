import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShoppingBag } from "lucide-react";

export function EmptyState({
  icon: Icon = ShoppingBag,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-espresso/5">
        <Icon className="h-7 w-7 text-taupe-dark" aria-hidden />
      </div>
      <h3 className="font-serif text-2xl text-espresso">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm font-sans text-sm leading-relaxed text-espresso-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
