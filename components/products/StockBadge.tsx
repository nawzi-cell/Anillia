import { Badge } from "@/components/ui/Badge";

/**
 * Stock indicator driven by available units.
 * `units` null/undefined = unknown stock → shown as in stock.
 */
export function StockBadge({ units }: { units?: number | null }) {
  if (units === 0) {
    return <Badge tone="muted">Out of stock</Badge>;
  }
  if (units != null && units <= 5) {
    return <Badge tone="sale">Only {units} left</Badge>;
  }
  return <Badge tone="success">In stock</Badge>;
}
