import { Loader2 } from "lucide-react";

export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-espresso-muted">
      <Spinner size={18} />
      {label}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse px-1 py-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 border-b border-espresso/5 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 rounded bg-espresso/10"
              style={{ width: `${90 - c * 12}%`, maxWidth: 180 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="font-serif text-lg font-semibold text-red-800">
        Something went wrong
      </p>
      <p className="mt-1 max-w-sm text-sm text-espresso-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-espresso/20 px-4 py-2 text-sm font-semibold text-espresso transition hover:border-espresso/50"
        >
          Try again
        </button>
      )}
    </div>
  );
}
