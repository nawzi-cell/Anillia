/**
 * ANILLIÉA storefront API client.
 *
 * Typed fetch wrapper for the ANILLIÉA backend. All responses follow the
 * envelope `{ success: true, data }` / `{ success: false, message, errors? }`.
 *
 * - `apiFetch`   → client components: relative path, `credentials: "include"`.
 * - `serverFetch`→ server components: absolute URL via NEXT_PUBLIC_APP_URL,
 *                  `cache: "no-store"`.
 */

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

function parseEnvelope<T>(json: unknown, fallback: string): T {
  const env = json as Envelope<T> | null;
  if (!env || typeof env !== "object" || !("success" in env)) {
    throw new Error(fallback);
  }
  if (!env.success) {
    throw new Error(env.message || fallback);
  }
  return env.data;
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

/** Client-side fetch. Throws Error(message) when the envelope reports failure. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return parseEnvelope<T>(json, `Request failed (${res.status})`);
}

function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (url && url.length > 0) return url;
  // Fall back to the port this server actually listens on, so a dev server
  // on a non-default port (or behind a tunnel) still resolves itself.
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/** Server-component fetch. Absolute URL, never cached. */
export async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${appBaseUrl()}${path}`, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  return parseEnvelope<T>(json, `Request failed (${res.status})`);
}

/** Format a number as PKR, e.g. 2500 → "PKR 2,500". */
export function formatPKR(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "PKR 0";
  return `PKR ${Math.round(n).toLocaleString("en-PK")}`;
}

/** Discount percentage between price and compare-at price, rounded. */
export function discountPercent(
  price: number,
  compareAtPrice: number | null | undefined
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/* ------------------------------------------------------------------ */
/* Shared API shapes (mirror the backend contract; all fields optional */
/* where the API may omit them).                                       */
/* ------------------------------------------------------------------ */

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductCategoryRef {
  slug: string;
  name: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Compare-at price when the product is discounted. */
  compareAtPrice?: number | null;
  images: ProductImage[];
  /** Colour names, e.g. ["Ivory", "Taupe"]. */
  colors?: string[];
  category?: ProductCategoryRef | null;
  /** Available units (server-computed). Absent on partial payloads (cart/wishlist). */
  available?: number | null;
  featured?: boolean;
}

/** True when the product is purchasable. Unknown availability counts as available. */
export function isAvailable(product: Pick<ProductListItem, "available">): boolean {
  return (product.available ?? 1) > 0;
}

/** Units left, or null when the payload does not carry stock info. */
export function unitsLeft(
  product: Pick<ProductListItem, "available">
): number | null {
  return product.available ?? null;
}

export interface ProductVariant {
  id: string;
  name: string;
  color: string | null;
  size: string | null;
  sku: string;
  /** Variant-level override; null falls back to the product price. */
  price: number | null;
  /** Available units (server-computed). */
  available: number;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  shortDescription?: string | null;
  material: string | null;
  careInstructions: string | null;
  variants: ProductVariant[];
  collections: ProductCategoryRef[];
  reviewSummary: { count: number; average: number | null };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
}

export interface Collection {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
}

/**
 * A cart line as returned by GET /api/cart. The nested product/variant are
 * partial selects (id, name, slug, price, images / id, name, sku, price).
 */
export interface CartItem {
  id: string;
  product: ProductListItem;
  variant: { id: string; name: string; sku: string; price: number | null } | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  available: number;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string | null;
}

export const emptyCart: CartData = {
  items: [],
  subtotal: 0,
  discount: 0,
  delivery: 0,
  total: 0,
  couponCode: null,
};

/** Raw wishlist row from GET /api/wishlist (array of rows, not wrapped). */
export interface WishlistRow {
  id: string;
  product: ProductListItem;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string;
  /** Unit price. */
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
}

/**
 * Order as returned by GET /api/orders/[id] (raw Prisma order).
 * The delivery address lives in flat shipping* fields.
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  deliveryMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  items: OrderItem[];
  shippingName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  notes: string | null;
  createdAt: string;
}

/** Build a display address from the order's flat shipping fields. */
export function orderAddress(order: Order): OrderAddress {
  return {
    fullName: order.shippingName,
    phone: order.shippingPhone,
    addressLine1: order.shippingAddressLine1,
    addressLine2: order.shippingAddressLine2,
    city: order.shippingCity,
    province: order.shippingProvince,
    postalCode: order.shippingPostalCode,
  };
}

/** Review row from GET /api/reviews (paginated). Author comes via user relation. */
export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
  user: { name: string };
}

/** Flattened review for display. */
export interface DisplayReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  authorName: string;
  createdAt: string;
}

export function toDisplayReview(review: Review): DisplayReview {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    authorName: review.user?.name ?? "Verified buyer",
    createdAt: review.createdAt,
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
