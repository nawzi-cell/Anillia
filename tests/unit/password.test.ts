/**
 * Unit tests for ../../lib/auth/password
 * (hashPassword / verifyPassword — bcrypt wrapper owned by the backend engineer)
 */
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("hashPassword", () => {
  it("returns a hash that is not the plaintext password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("produces a bcrypt hash", async () => {
    const hash = await hashPassword("another-password");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("salts hashes so the same password hashes differently", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword("s3cret!", hash)).resolves.toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false when the hash is garbage", async () => {
    await expect(verifyPassword("s3cret!", "not-a-hash")).resolves.toBe(false);
  });
});
