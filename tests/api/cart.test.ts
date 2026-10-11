/**
 * API integration tests: cart + coupons.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  makeRequest,
  readJson,
  clearTestCookies,
  registerViaApi,
  loginViaApi,
  uniqueEmail,
} from "./testkit";
import { prisma } from "@/lib/db/prisma";

const PASSWORD = "TestPass123!";

async function purchasableVariant() {
  const variant = await prisma.productVariant.findFirst({
    where: {
      active: true,
      product: { published: true },
      inventory: { quantity: { gt: 5 } },
    },
    include: { inventory: true, product: { select: { id: true, price: true } } },
  });
  if (!variant?.inventory) throw new Error("seed has no stocked variant");
  return variant;
}

async function loggedInCustomer() {
  const email = uniqueEmail("cart");
  await registerViaApi(email, PASSWORD);
  const login = await loginViaApi(email, PASSWORD);
  expect(login.status).toBe(200);
  return email;
}

beforeEach(() => {
  clearTestCookies();
});

describe("cart", () => {
  it("rejects unauthenticated cart access with 401", async () => {
    const { GET } = await import("@/app/api/cart/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(401);
  });

  it("adds an item, shows it in the cart, and increments on re-add", async () => {
    await loggedInCustomer();
    const variant = await purchasableVariant();
    const { POST } = await import("@/app/api/cart/items/route");

    const add = async (quantity: number) =>
      readJson(
        await POST(
          makeRequest("/api/cart/items", {
            method: "POST",
            body: {
              productId: variant.productId,
              variantId: variant.id,
              quantity,
            },
          }),
        ),
      );

    const first = await add(1);
    expect([200, 201]).toContain(first.status);
    const second = await add(2);
    expect([200, 201]).toContain(second.status);

    const { GET } = await import("@/app/api/cart/route");
    const cart = await readJson(await GET());
    expect(cart.status).toBe(200);
    const line = cart.json.data.items.find(
      (i: any) => i.variant?.id === variant.id || i.product?.id === variant.productId,
    );
    expect(line).toBeTruthy();
    expect(line.quantity).toBe(3);
    expect(cart.json.data.subtotal).toBeGreaterThan(0);
  });

  it("rejects quantities beyond available stock with 422", async () => {
    await loggedInCustomer();
    const variant = await purchasableVariant();
    const { POST } = await import("@/app/api/cart/items/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/cart/items", {
          method: "POST",
          body: {
            productId: variant.productId,
            variantId: variant.id,
            quantity: 1000,
          },
        }),
      ),
    );
    expect(out.status).toBe(422);
  });

  it("updates and removes a line item", async () => {
    await loggedInCustomer();
    const variant = await purchasableVariant();
    const itemsRoute = await import("@/app/api/cart/items/route");
    await readJson(
      await itemsRoute.POST(
        makeRequest("/api/cart/items", {
          method: "POST",
          body: {
            productId: variant.productId,
            variantId: variant.id,
            quantity: 2,
          },
        }),
      ),
    );

    const { GET } = await import("@/app/api/cart/route");
    const cart = await readJson(await GET());
    const lineId = cart.json.data.items[0].id as string;

    const itemRoute = await import("@/app/api/cart/items/[id]/route");
    const updated = await readJson(
      await itemRoute.PUT(
        makeRequest(`/api/cart/items/${lineId}`, {
          method: "PUT",
          body: { quantity: 1 },
        }),
        { params: { id: lineId } },
      ),
    );
    expect([200, 201]).toContain(updated.status);

    const removed = await readJson(
      await itemRoute.DELETE(makeRequest(`/api/cart/items/${lineId}`, { method: "DELETE" }), {
        params: { id: lineId },
      }),
    );
    expect([200, 204]).toContain(removed.status);

    const empty = await readJson(await GET());
    expect(empty.json.data.items.length).toBe(0);
  });
});

describe("cart coupons", () => {
  it("applies WELCOME10 and then removes it", async () => {
    await loggedInCustomer();
    const variant = await purchasableVariant();
    // WELCOME10 needs a 1500 subtotal — buy enough units to clear it.
    const unitPrice = variant.price ?? variant.product.price ?? 1000;
    const quantity = Math.min(Math.ceil(1600 / unitPrice), 10);
    const itemsRoute = await import("@/app/api/cart/items/route");
    const added = await readJson(
      await itemsRoute.POST(
        makeRequest("/api/cart/items", {
          method: "POST",
          body: {
            productId: variant.productId,
            variantId: variant.id,
            quantity,
          },
        }),
      ),
    );
    expect([200, 201]).toContain(added.status);

    const couponRoute = await import("@/app/api/cart/coupon/route");
    const applied = await readJson(
      await couponRoute.POST(
        makeRequest("/api/cart/coupon", {
          method: "POST",
          body: { code: "WELCOME10" },
        }),
      ),
    );
    expect(applied.status).toBe(200);
    expect(applied.json.data.discount).toBeGreaterThan(0);

    const removed = await readJson(await couponRoute.DELETE());
    expect(removed.status).toBe(200);
  });

  it("rejects an invalid coupon with 400", async () => {
    await loggedInCustomer();
    const { POST } = await import("@/app/api/cart/coupon/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/cart/coupon", {
          method: "POST",
          body: { code: "NOTACODE" },
        }),
      ),
    );
    expect(out.status).toBe(400);
  });

  it("validates a coupon publicly via /api/coupons/validate", async () => {
    const { POST } = await import("@/app/api/coupons/validate/route");
    const good = await readJson(
      await POST(
        makeRequest("/api/coupons/validate", {
          method: "POST",
          body: { code: "WELCOME10", subtotal: 5000 },
        }),
      ),
    );
    expect(good.status).toBe(200);
    expect(good.json.data.valid).toBe(true);

    const bad = await readJson(
      await POST(
        makeRequest("/api/coupons/validate", {
          method: "POST",
          body: { code: "NOPE", subtotal: 5000 },
        }),
      ),
    );
    expect(bad.status).toBe(200);
    expect(bad.json.data.valid).toBe(false);
  });
});
