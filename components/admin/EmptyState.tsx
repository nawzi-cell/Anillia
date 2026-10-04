import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-espresso/5 text-espresso-muted">
        <Inbox size={22} />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-espresso">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-espresso-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
