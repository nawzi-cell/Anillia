/**
 * API integration tests: end-to-end workflows and integrity regressions.
 *
 * Workflow A — customer registration → cart → checkout (COD, bank transfer)
 * Workflow B — admin product creation → storefront → fulfilment transitions
 * Workflow C — customers are blocked from every admin surface
 * Workflow D — concurrent checkouts can never oversell the last unit
 * Workflow E — invalid coupon and unavailable payment fail without side effects
 *
 * Plus regressions for coupon limits, cancellation restock, and double-cancel
 * idempotency.
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
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "./testEnv";
import { prisma } from "@/lib/db/prisma";
import { createOrder } from "@/lib/orders/checkout";
import { ApiError } from "@/lib/api/errors";

const PASSWORD = "TestPass123!";

const ADDRESS = {
  fullName: "Workflow Tester",
  phone: "03001234567",
  addressLine1: "House 1, Street 2",
  city: "Lahore",
  province: "Punjab",
  postalCode: "54000",
};

function suffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

async function loginAsAdmin() {
  clearTestCookies();
  const out = await loginViaApi(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
  expect(out.status).toBe(200);
}

async function customer(): Promise<{ id: string; email: string }> {
  const email = uniqueEmail("flow");
  const reg = await registerViaApi(email, PASSWORD);
  expect(reg.status).toBe(201);
  const login = await loginViaApi(email, PASSWORD);
  expect(login.status).toBe(200);
  return { id: login.json.data.id as string, email };
}

async function stockedVariant() {
  const variant = await prisma.productVariant.findFirst({
    where: {
      active: true,
      product: { published: true },
      inventory: { quantity: { gte: 6 } },
    },
    include: { inventory: true },
  });
  if (!variant?.inventory) throw new Error("seed has no stocked variant");
  return variant;
}

async function addToCart(productId: string, variantId: string, quantity: number) {
  const { POST } = await import("@/app/api/cart/items/route");
  const out = await readJson(
    await POST(
      makeRequest("/api/cart/items", {
        method: "POST",
        body: { productId, variantId, quantity },
      }),
    ),
  );
  expect([200, 201]).toContain(out.status);
  return out;
}

async function checkout(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/checkout/route");
  return readJson(
    await POST(makeRequest("/api/checkout", { method: "POST", body })),
  );
}

async function adminSetStatus(id: string, status: string) {
  const { PUT } = await import("@/app/api/admin/orders/[id]/route");
  return readJson(
    await PUT(
      makeRequest(`/api/admin/orders/${id}`, { method: "PUT", body: { status } }),
      { params: { id } },
    ),
  );
}

async function makePublishedProduct(quantity: number) {
  const s = suffix();
  const product = await prisma.product.create({
    data: {
      name: `Audit Fixture ${s}`,
      slug: `audit-fixture-${s}`,
      description: "Fixture product for workflow tests.",
      price: 1200,
      sku: `FIX-${s}`,
      published: true,
      variants: {
        create: { name: "Default", sku: `FIX-${s}-V`, active: true },
      },
    },
    include: { variants: true },
  });
  const variant = product.variants[0];
  const inventoryRow = await prisma.inventory.create({
    data: { productId: product.id, variantId: variant.id, quantity },
  });
  await prisma.inventory.create({ data: { productId: product.id, quantity: 0 } });
  return { product, variant, inventoryRow };
}

async function seedCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number,
) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  await prisma.cartItem.create({
    data: { cartId: cart.id, productId, variantId, quantity },
  });
}

beforeEach(() => {
  clearTestCookies();
});

describe("Workflow A — registration → cart → checkout", () => {
  it("places a bank-transfer order and blocks duplicate submission", async () => {
    const user = await customer();
    const variant = await stockedVariant();
    await addToCart(variant.productId, variant.id, 1);

    const placed = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "BANK_TRANSFER",
    });
    expect(placed.status).toBe(201);
    const orderId = placed.json.data.id as string;

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payment: true },
    });
    expect(stored.payment?.provider).toBe("bank_transfer");
    expect(stored.payment?.status).toBe("PENDING");
    const metadata = stored.payment?.metadata as { instructions?: string } | null;
    expect(metadata?.instructions?.length).toBeGreaterThan(0);

    // A second submission (double-click / refresh) sees the cleared cart.
    const duplicate = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "BANK_TRANSFER",
    });
    expect(duplicate.status).toBe(400);

    const orders = await prisma.order.count({ where: { userId: user.id } });
    expect(orders).toBe(1);
  });
});

describe("Workflow B — admin product → storefront → fulfilment", () => {
  it("creates a product in admin, sells it, and advances it to delivered", async () => {
    await loginAsAdmin();
    const s = suffix();
    const { POST: createProduct } = await import("@/app/api/admin/products/route");
    const created = await readJson(
      await createProduct(
        makeRequest("/api/admin/products", {
          method: "POST",
          body: {
            name: `Admin Workflow ${s}`,
            slug: `admin-workflow-${s}`,
            description: "Created through the admin API.",
            price: 1500,
            sku: `AW-${s}`,
            published: true,
            images: [],
            variants: [
              { name: "Default", sku: `AW-${s}-V`, quantity: 5, active: true },
            ],
            collectionIds: [],
          },
        }),
      ),
    );
    expect(created.status).toBe(201);
    const productId = created.json.data.id as string;
    const variantId = created.json.data.variants[0].id as string;
    const slug = created.json.data.slug as string;

    // Storefront sees the new product with real availability.
    const { GET: getProduct } = await import("@/app/api/products/[slug]/route");
    const detail = await readJson(
      await getProduct(makeRequest(`/api/products/${slug}`), {
        params: { slug },
      }),
    );
    expect(detail.status).toBe(200);
    expect(detail.json.data.available).toBe(5);
    expect(detail.json.data.variants[0].available).toBe(5);

    // Customer purchases it.
    await customer();
    await addToCart(productId, variantId, 2);
    const placed = await checkout({
      address: ADDRESS,
      deliveryMethod: "EXPRESS",
      paymentMethod: "COD",
    });
    expect(placed.status).toBe(201);
    const orderId = placed.json.data.id as string;
    expect(placed.json.data.deliveryFee).toBe(450);

    // Admin advances the order along the allowed transitions.
    await loginAsAdmin();
    for (const status of ["CONFIRMED", "SHIPPED", "DELIVERED"]) {
      const updated = await adminSetStatus(orderId, status);
      expect(updated.status).toBe(200);
      expect(updated.json.data.status).toBe(status);
    }

    // Terminal states reject further transitions.
    const invalid = await adminSetStatus(orderId, "CONFIRMED");
    expect(invalid.status).toBe(409);

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(stored.status).toBe("DELIVERED");
    const userId = stored.userId;
    const notifications = await prisma.notification.count({ where: { userId } });
    expect(notifications).toBeGreaterThanOrEqual(2);
  });
});

describe("Workflow C — customer blocked from admin APIs", () => {
  it("returns 403 on admin orders, products and dashboard", async () => {
    await customer();
    const orders = await import("@/app/api/admin/orders/route");
    const products = await import("@/app/api/admin/products/route");
    const dashboard = await import("@/app/api/admin/dashboard/route");

    const a = await readJson(await orders.GET(makeRequest("/api/admin/orders")));
    const b = await readJson(await products.GET(makeRequest("/api/admin/products")));
    const c = await readJson(await dashboard.GET());
    expect([a.status, b.status, c.status]).toEqual([403, 403, 403]);
  });
});

describe("Workflow D — concurrent checkout of the last unit", () => {
  it("lets exactly one customer buy a single-unit product", async () => {
    const { product, variant, inventoryRow } = await makePublishedProduct(1);
    const a = await customer();
    const b = await customer();
    await seedCart(a.id, product.id, variant.id, 1);
    await seedCart(b.id, product.id, variant.id, 1);

    const attempts = await Promise.allSettled([
      createOrder(a.id, {
        address: ADDRESS,
        deliveryMethod: "STANDARD",
        paymentMethod: "COD",
      }),
      createOrder(b.id, {
        address: ADDRESS,
        deliveryMethod: "STANDARD",
        paymentMethod: "COD",
      }),
    ]);

    const fulfilled = attempts.filter((r) => r.status === "fulfilled");
    const rejected = attempts.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ApiError);
    expect([409, 422]).toContain((rejected[0].reason as ApiError).status);

    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id: inventoryRow.id },
    });
    expect(inventory.quantity).toBe(0);

    const orders = await prisma.order.count({
      where: { userId: { in: [a.id, b.id] } },
    });
    expect(orders).toBe(1);
  });
});

describe("Workflow E — failed checkout leaves no side effects", () => {
  it("rejects an invalid coupon without creating an order or touching stock", async () => {
    const user = await customer();
    const variant = await stockedVariant();
    await addToCart(variant.productId, variant.id, 1);
    const before = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;

    const out = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "COD",
      couponCode: "NO-SUCH-COUPON",
    });
    expect(out.status).toBe(400);

    const after = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;
    expect(after).toBe(before);
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
    const { GET: getCart } = await import("@/app/api/cart/route");
    const cart = await readJson(await getCart());
    expect(cart.json.data.items.length).toBe(1);
  });

  it("rejects online payment without creating an order or clearing the cart", async () => {
    const user = await customer();
    const variant = await stockedVariant();
    await addToCart(variant.productId, variant.id, 1);
    const before = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;

    const out = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "ONLINE",
    });
    expect(out.status).toBe(400);

    const after = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;
    expect(after).toBe(before);
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
    const { GET: getCart } = await import("@/app/api/cart/route");
    const cart = await readJson(await getCart());
    expect(cart.json.data.items.length).toBe(1);
  });
});

describe("Coupon limits and cancellation integrity", () => {
  it("enforces a usage limit and restores stock/coupon on cancellation", async () => {
    // Admin creates a single-use coupon.
    await loginAsAdmin();
    const code = `ONCE-${suffix()}`.toUpperCase();
    const { POST: createCoupon } = await import("@/app/api/admin/coupons/route");
    const coupon = await readJson(
      await createCoupon(
        makeRequest("/api/admin/coupons", {
          method: "POST",
          body: {
            code,
            type: "PERCENTAGE",
            value: 10,
            minimumOrderAmount: 0,
            usageLimit: 1,
            active: true,
          },
        }),
      ),
    );
    expect(coupon.status).toBe(201);

    const variant = await stockedVariant();
    const stockBefore = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;
    const soldBefore = (
      await prisma.product.findUniqueOrThrow({ where: { id: variant.productId } })
    ).soldCount;

    // First customer uses the coupon successfully.
    await customer();
    await addToCart(variant.productId, variant.id, 2);
    const placed = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "COD",
      couponCode: code,
    });
    expect(placed.status).toBe(201);
    const orderId = placed.json.data.id as string;
    expect(placed.json.data.couponCode).toBe(code);

    const used = await prisma.coupon.findUniqueOrThrow({ where: { code } });
    expect(used.usedCount).toBe(1);

    // A second customer can no longer use it, and stock is untouched by the
    // rejected attempt.
    const second = await customer();
    await addToCart(variant.productId, variant.id, 1);
    const stockAfterFirst = (
      await prisma.inventory.findUniqueOrThrow({
        where: { id: variant.inventory!.id },
      })
    ).quantity;
    const rejected = await checkout({
      address: ADDRESS,
      deliveryMethod: "STANDARD",
      paymentMethod: "COD",
      couponCode: code,
    });
    expect([400, 409]).toContain(rejected.status);
    expect(await prisma.order.count({ where: { userId: second.id } })).toBe(0);
    expect(
      (
        await prisma.inventory.findUniqueOrThrow({
          where: { id: variant.inventory!.id },
        })
      ).quantity,
    ).toBe(stockAfterFirst);

    // Admin cancels the first order: stock, sold count and coupon are restored.
    await loginAsAdmin();
    const cancelled = await adminSetStatus(orderId, "CANCELLED");
    expect(cancelled.status).toBe(200);
    expect(cancelled.json.data.status).toBe("CANCELLED");

    expect(
      (
        await prisma.inventory.findUniqueOrThrow({
          where: { id: variant.inventory!.id },
        })
      ).quantity,
    ).toBe(stockBefore);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: variant.productId } }))
        .soldCount,
    ).toBe(soldBefore);
    const released = await prisma.coupon.findUniqueOrThrow({ where: { code } });
    expect(released.usedCount).toBe(0);
    expect(await prisma.couponUsage.count({ where: { couponId: released.id } })).toBe(0);

    // Re-sending CANCELLED is an idempotent no-op and does not restock twice.
    const again = await adminSetStatus(orderId, "CANCELLED");
    expect(again.status).toBe(200);
    expect(again.json.data.status).toBe("CANCELLED");
    expect(
      (
        await prisma.inventory.findUniqueOrThrow({
          where: { id: variant.inventory!.id },
        })
      ).quantity,
    ).toBe(stockBefore);
  });
});
