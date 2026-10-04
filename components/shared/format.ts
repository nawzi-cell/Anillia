/**
 * Shared display-formatting helpers for the storefront.
 * (Kept out of page.tsx files — Next.js only allows specific named
 * exports from route modules.)
 */

/** "ORDER_STATUS" -> "Order Status", "BANK_TRANSFER" -> "Bank Transfer". */
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** "2026-10-02" -> "2 October 2026" (en-PK long date). */
export function formatPostDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
