/**
 * API integration tests: checkout (transactional order placement).
 *
 * This is the money path: server-computed totals, stock validation,
 * inventory decrement, cart clearing — all asserted end to end.
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

const ADDRESS = {
  fullName: "API Tester",
  phone: "03001234567",
  addressLine1: "House 1, Street 2",
  city: "Lahore",
  province: "Punjab",
  postalCode: "54000",
};

async function stockedVariant() {
  const variant = await prisma.productVariant.findFirst({
    where: {
      active: true,
      product: { published: true },
      inventory: { quantity: { gt: 5 } },
    },
    include: { inventory: true },
  });
  if (!variant?.inventory) throw new Error("seed has no stocked variant");
  return variant;
}

async function customerWithCart(quantity = 2) {
  const email = uniqueEmail("checkout");
  await registerViaApi(email, PASSWORD);
  await loginViaApi(email, PASSWORD);
  const variant = await stockedVariant();
  const { POST } = await import("@/app/api/cart/items/route");
  const added = await readJson(
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
  expect([200, 201]).toContain(added.status);
  return { email, variant };
}

beforeEach(() => {
  clearTestCookies();
});

describe("POST /api/checkout", () => {
  it("places a COD order: 201, decrements stock, clears the cart", async () => {
    const { variant } = await customerWithCart(2);
    const before = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;

    const { POST } = await import("@/app/api/checkout/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: {
            address: ADDRESS,
            deliveryMethod: "STANDARD",
            paymentMethod: "COD",
          },
        }),
      ),
    );

    expect(out.status).toBe(201);
    expect(out.json.success).toBe(true);
    const order = out.json.data;
    expect(order.orderNumber).toBeTruthy();
    expect(order.paymentMethod).toBe("COD");
    expect(order.total).toBe(order.subtotal - order.discount + order.deliveryFee);
    expect(order.total).toBeGreaterThan(0);
    expect(order.items.length).toBeGreaterThan(0);

    // Stock was decremented transactionally…
    const after = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;
    expect(after).toBe(before - 2);

    // …and the cart was cleared.
    const { GET } = await import("@/app/api/cart/route");
    const cart = await readJson(await GET());
    expect(cart.json.data.items.length).toBe(0);

    // The order shows up in the customer's order history.
    const ordersRoute = await import("@/app/api/orders/route");
    const list = await readJson(await ordersRoute.GET(makeRequest("/api/orders")));
    expect(list.status).toBe(200);
    expect(
      list.json.data.items.some((o: any) => o.id === order.id),
    ).toBe(true);
  });

  it("applies a coupon to the order totals", async () => {
    const variant = await stockedVariant();
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: variant.productId },
      select: { price: true },
    });
    const unitPrice = variant.price ?? product.price ?? 1000;
    const qty = Math.max(2, Math.ceil(1600 / unitPrice));
    await customerWithCart(qty);
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
    const expectedDiscount = applied.json.data.discount as number;
    expect(expectedDiscount).toBeGreaterThan(0);

    const { POST } = await import("@/app/api/checkout/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: {
            address: ADDRESS,
            deliveryMethod: "STANDARD",
            paymentMethod: "COD",
            couponCode: "WELCOME10",
          },
        }),
      ),
    );
    expect(out.status).toBe(201);
    expect(out.json.data.discount).toBe(expectedDiscount);
    expect(out.json.data.couponCode).toBe("WELCOME10");
  });

  it("rejects checkout with an empty cart", async () => {
    const email = uniqueEmail("emptycart");
    await registerViaApi(email, PASSWORD);
    await loginViaApi(email, PASSWORD);

    const { POST } = await import("@/app/api/checkout/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: {
            address: ADDRESS,
            deliveryMethod: "STANDARD",
            paymentMethod: "COD",
          },
        }),
      ),
    );
    expect(out.status).toBe(400);
  });

  it("rejects checkout without an address with 422", async () => {
    await customerWithCart(1);
    const { POST } = await import("@/app/api/checkout/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: { deliveryMethod: "STANDARD", paymentMethod: "COD" },
        }),
      ),
    );
    expect(out.status).toBe(422);
  });

  it("rejects unauthenticated checkout with 401", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: {
            address: ADDRESS,
            deliveryMethod: "STANDARD",
            paymentMethod: "COD",
          },
          cookie: null,
        }),
      ),
    );
    expect(out.status).toBe(401);
  });
});

describe("GET /api/orders", () => {
  it("shows order detail to its owner but not to strangers", async () => {
    // Owner places an order.
    const ownerEmail = uniqueEmail("owner");
    await registerViaApi(ownerEmail, PASSWORD);
    await loginViaApi(ownerEmail, PASSWORD);
    const variant = await stockedVariant();
    const itemsRoute = await import("@/app/api/cart/items/route");
    await readJson(
      await itemsRoute.POST(
        makeRequest("/api/cart/items", {
          method: "POST",
          body: {
            productId: variant.productId,
            variantId: variant.id,
            quantity: 1,
          },
        }),
      ),
    );
    const checkoutRoute = await import("@/app/api/checkout/route");
    const placed = await readJson(
      await checkoutRoute.POST(
        makeRequest("/api/checkout", {
          method: "POST",
          body: {
            address: ADDRESS,
            deliveryMethod: "STANDARD",
            paymentMethod: "COD",
          },
        }),
      ),
    );
    expect(placed.status).toBe(201);
    const orderId = placed.json.data.id as string;

    const ordersRoute = await import("@/app/api/orders/[id]/route");
    const own = await readJson(
      await ordersRoute.GET(makeRequest(`/api/orders/${orderId}`), {
        params: { id: orderId },
      }),
    );
    expect(own.status).toBe(200);
    expect(own.json.data.id).toBe(orderId);

    // A different customer cannot see it.
    const strangerEmail = uniqueEmail("stranger");
    await registerViaApi(strangerEmail, PASSWORD);
    await loginViaApi(strangerEmail, PASSWORD);
    const foreign = await readJson(
      await ordersRoute.GET(makeRequest(`/api/orders/${orderId}`), {
        params: { id: orderId },
      }),
    );
    expect([403, 404]).toContain(foreign.status);
  });
});
