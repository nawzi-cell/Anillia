import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, icon, hint, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? "border-red-800/25 bg-red-50/40"
          : "border-espresso/10 bg-ivory-light"
      } shadow-[0_1px_3px_rgba(42,37,33,0.06)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-espresso">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-espresso-muted">{hint}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            accent ? "bg-red-800/10 text-red-800" : "bg-olive/10 text-olive"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-espresso/10 bg-ivory-light p-5">
      <div className="h-3 w-24 rounded bg-espresso/10" />
      <div className="mt-3 h-8 w-32 rounded bg-espresso/10" />
    </div>
  );
}
