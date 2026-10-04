export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-espresso/10 ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}
