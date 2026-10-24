import { describe, it, expect } from "vitest";
import { hashToken } from "@/lib/auth/tokens";

describe("hashToken", () => {
  it("returns a stable SHA-256 hex digest", () => {
    const digest = hashToken("reset-token-value");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("reset-token-value")).toBe(digest);
  });

  it("does not return the raw token", () => {
    const token = "super-secret-token";
    expect(hashToken(token)).not.toContain(token);
  });

  it("differs for different tokens", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});
