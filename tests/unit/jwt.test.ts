/**
 * Unit tests for ../../lib/auth/jwt
 * (signToken / verifyToken — JWT session tokens owned by the backend engineer)
 *
 * Contract assumed:
 *   signToken(payload: { sub: string; role: string }, expiresIn?: string): string
 *   verifyToken(token: string): { sub: string; role: string } | null
 * where verifyToken returns null for garbage, tampered, or expired tokens.
 */
import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../lib/auth/jwt";

const PAYLOAD = { sub: "user-123", role: "CUSTOMER" } as const;

describe("signToken / verifyToken round-trip", () => {
  it("preserves sub and role", () => {
    const token = signToken({ ...PAYLOAD });
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("user-123");
    expect(decoded?.role).toBe("CUSTOMER");
  });

  it("round-trips an ADMIN payload", () => {
    const token = signToken({ sub: "admin-1", role: "ADMIN" });
    const decoded = verifyToken(token);
    expect(decoded?.sub).toBe("admin-1");
    expect(decoded?.role).toBe("ADMIN");
  });
});

describe("verifyToken rejects bad tokens", () => {
  it("returns null for garbage input", () => {
    expect(verifyToken("not-a-token")).toBeNull();
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("a.b.c")).toBeNull();
  });

  it("returns null for a tampered token", () => {
    const token = signToken({ ...PAYLOAD });
    const parts = token.split(".");
    // Flip the payload segment so the signature no longer matches.
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: "attacker", role: "ADMIN" })
    ).toString("base64url");
    expect(verifyToken([parts[0], tamperedPayload, parts[2]].join("."))).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const token = signToken({ ...PAYLOAD }, "1s");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(verifyToken(token)).toBeNull();
  });
});
