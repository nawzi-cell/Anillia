/**
 * Order status transition rules shared by the API and the admin UI.
 * Terminal states (CANCELLED, RETURNED) cannot be left.
 */

export const ORDER_STATUS_FLOW = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  CANCELLED: [],
  RETURNED: [],
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_FLOW;

export function isOrderStatus(value: string): value is OrderStatus {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS_FLOW, value);
}

export function allowedNextStatuses(status: string): OrderStatus[] {
  if (!isOrderStatus(status)) return [];
  return [...ORDER_STATUS_FLOW[status]];
}

export function canTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return (ORDER_STATUS_FLOW[from] as readonly string[]).includes(to);
}

/** Cancellation and returns put the purchased units back on the shelf. */
export function restoresInventory(status: string): boolean {
  return status === "CANCELLED" || status === "RETURNED";
}
