import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-espresso/10 bg-ivory-light p-6 shadow-[0_2px_24px_rgba(42,37,33,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
