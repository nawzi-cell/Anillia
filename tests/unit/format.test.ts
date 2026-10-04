/**
 * Unit tests for ../../lib/utils/format
 * (formatPKR / slugify owned by the backend engineer)
 */
import { describe, it, expect } from "vitest";
import { formatPKR, slugify } from "../../lib/utils/format";

describe("formatPKR", () => {
  it("formats 1250 as 'PKR 1,250'", () => {
    expect(formatPKR(1250)).toBe("PKR 1,250");
  });

  it("formats small and large amounts with thousands separators", () => {
    expect(formatPKR(450)).toBe("PKR 450");
    expect(formatPKR(1000000)).toBe("PKR 1,000,000");
  });

  it("formats zero", () => {
    expect(formatPKR(0)).toBe("PKR 0");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates a product name", () => {
    expect(slugify("Crinkle Georgette Hijab")).toBe("crinkle-georgette-hijab");
  });

  it("trims and collapses whitespace", () => {
    expect(slugify("  Everyday   Modest Deal  ")).toBe("everyday-modest-deal");
  });

  it("strips punctuation", () => {
    expect(slugify("The Gift Edit!")).toBe("the-gift-edit");
  });

  it("handles already-slugified input idempotently", () => {
    expect(slugify("hijabs")).toBe("hijabs");
    expect(slugify("signature-bundles")).toBe("signature-bundles");
  });
});
