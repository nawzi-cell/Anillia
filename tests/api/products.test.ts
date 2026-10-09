/**
 * API integration tests: public product catalogue.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { makeRequest, readJson, clearTestCookies } from "./testkit";
import { prisma } from "@/lib/db/prisma";

beforeEach(() => {
  clearTestCookies();
});

describe("GET /api/products", () => {
  it("lists published products with pagination metadata", async () => {
    const { GET } = await import("@/app/api/products/route");
    const out = await readJson(await GET(makeRequest("/api/products")));
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
    expect(out.json.data.items.length).toBeGreaterThan(0);
    expect(out.json.data.total).toBeGreaterThanOrEqual(
      out.json.data.items.length,
    );
    expect(out.json.data).toHaveProperty("totalPages");
    for (const p of out.json.data.items) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("slug");
      expect(p).toHaveProperty("price");
    }
  });

  it("paginates with limit/page", async () => {
    const { GET } = await import("@/app/api/products/route");
    const out = await readJson(
      await GET(makeRequest("/api/products?limit=2&page=1")),
    );
    expect(out.status).toBe(200);
    expect(out.json.data.items.length).toBeLessThanOrEqual(2);
    expect(out.json.data.page).toBe(1);
    expect(out.json.data.limit).toBe(2);
  });

  it("searches by name", async () => {
    const { GET } = await import("@/app/api/products/route");
    const out = await readJson(
      await GET(makeRequest("/api/products?search=hijab")),
    );
    expect(out.status).toBe(200);
    expect(out.json.data.items.length).toBeGreaterThan(0);
  });
});

describe("GET /api/products/[slug]", () => {
  it("returns product detail with variants for a known slug", async () => {
    const product = await prisma.product.findFirst({
      where: { published: true },
      select: { slug: true },
    });
    expect(product).toBeTruthy();

    const { GET } = await import("@/app/api/products/[slug]/route");
    const out = await readJson(
      await GET(makeRequest(`/api/products/${product!.slug}`), {
        params: { slug: product!.slug },
      }),
    );
    expect(out.status).toBe(200);
    expect(out.json.data.slug).toBe(product!.slug);
    expect(out.json.data).toHaveProperty("variants");
  });

  it("returns 404 for an unknown slug", async () => {
    const { GET } = await import("@/app/api/products/[slug]/route");
    const out = await readJson(
      await GET(makeRequest("/api/products/no-such-product"), {
        params: { slug: "no-such-product" },
      }),
    );
    expect(out.status).toBe(404);
  });
});

describe("GET /api/categories", () => {
  it("lists categories", async () => {
    const { GET } = await import("@/app/api/categories/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(200);
    expect(out.json.data.length).toBeGreaterThan(0);
  });
});
