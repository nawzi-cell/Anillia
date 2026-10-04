/** Formatting and string utilities. */

import { randomBytes } from "node:crypto";

/**
 * Format a whole-PKR amount, e.g. 1250 -> "PKR 1,250".
 */
export function formatPKR(amount: number): string {
  return `PKR ${new Intl.NumberFormat("en-PK").format(Math.round(amount))}`;
}

/** Convert a string into a URL-friendly slug. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate an order number: ANL-YYYYMMDD-XXXX (crypto-random, uppercase alnum).
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const bytes = randomBytes(4);
  let suffix = "";
  for (const b of bytes) {
    suffix += ORDER_ALPHABET[b % ORDER_ALPHABET.length];
  }
  return `ANL-${y}${m}${d}-${suffix}`;
}
