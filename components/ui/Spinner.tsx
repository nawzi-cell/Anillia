export function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" }[size];
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-taupe/40 border-t-espresso ${dims} ${className}`}
    />
  );
}
