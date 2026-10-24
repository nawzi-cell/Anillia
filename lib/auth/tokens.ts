import { createHash } from "node:crypto";

/** Store only a digest of single-use tokens; the raw value goes in the link. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
