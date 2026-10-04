/**
 * Unit tests for assertRole in ../../lib/auth/session
 * (authorization guard owned by the backend engineer)
 *
 * Contract:
 *   assertRole(user: { role: string } | null, role: "ADMIN"): void
 *   - throws an ApiError with status 401 when user is null/undefined
 *   - throws an ApiError with status 403 when user.role !== role
 *   - returns normally when the roles match
 */
import { describe, it, expect } from "vitest";
import { assertRole } from "../../lib/auth/session";
import { ApiError } from "../../lib/api/errors";

function statusOf(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}

describe("assertRole", () => {
  it("throws 401 when the user is null", () => {
    try {
      assertRole(null, "ADMIN");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(statusOf(error)).toBe(401);
    }
  });

  it("throws 401 when the user is undefined", () => {
    try {
      assertRole(undefined as unknown as null, "ADMIN");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(statusOf(error)).toBe(401);
    }
  });

  it("throws 403 when a CUSTOMER hits an ADMIN-only guard", () => {
    try {
      assertRole({ role: "CUSTOMER" }, "ADMIN");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(statusOf(error)).toBe(403);
    }
  });

  it("passes when the roles match", () => {
    expect(() => assertRole({ role: "ADMIN" }, "ADMIN")).not.toThrow();
  });

  it("throws when the required role does not match at runtime", () => {
    // The type system only allows "ADMIN" here; the cast documents that a
    // runtime mismatch is still rejected rather than silently passing.
    expect(() =>
      assertRole({ role: "ADMIN" }, "SUPERADMIN" as "ADMIN")
    ).toThrow();
  });
});
