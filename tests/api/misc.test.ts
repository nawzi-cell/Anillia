/**
 * API integration tests: wishlist, newsletter, contact.
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

async function loggedInCustomer() {
  const email = uniqueEmail("wish");
  await registerViaApi(email, PASSWORD);
  const login = await loginViaApi(email, PASSWORD);
  expect(login.status).toBe(200);
}

async function publishedProductId(): Promise<string> {
  const p = await prisma.product.findFirst({
    where: { published: true },
    select: { id: true },
  });
  if (!p) throw new Error("seed has no published product");
  return p.id;
}

beforeEach(() => {
  clearTestCookies();
});

describe("wishlist", () => {
  it("rejects unauthenticated access with 401", async () => {
    const { GET } = await import("@/app/api/wishlist/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(401);
  });

  it("adds, lists, and removes a product", async () => {
    await loggedInCustomer();
    const productId = await publishedProductId();

    const { POST, GET } = await import("@/app/api/wishlist/route");
    const added = await readJson(
      await POST(
        makeRequest("/api/wishlist", {
          method: "POST",
          body: { productId },
        }),
      ),
    );
    expect([200, 201]).toContain(added.status);

    const list = await readJson(await GET());
    expect(list.status).toBe(200);
    const ids = (Array.isArray(list.json.data)
      ? list.json.data
      : list.json.data.items ?? []
    ).map((w: any) => w.product?.id ?? w.productId);
    expect(ids).toContain(productId);

    const delRoute = await import("@/app/api/wishlist/[productId]/route");
    const removed = await readJson(
      await delRoute.DELETE(makeRequest(`/api/wishlist/${productId}`, { method: "DELETE" }), {
        params: { productId },
      }),
    );
    expect([200, 204]).toContain(removed.status);

    const after = await readJson(await GET());
    const idsAfter = (Array.isArray(after.json.data)
      ? after.json.data
      : after.json.data.items ?? []
    ).map((w: any) => w.product?.id ?? w.productId);
    expect(idsAfter).not.toContain(productId);
  });
});

describe("newsletter & contact", () => {
  it("subscribes an email to the newsletter (idempotent)", async () => {
    const { POST } = await import("@/app/api/newsletter/route");
    const email = uniqueEmail("news");
    const first = await readJson(
      await POST(
        makeRequest("/api/newsletter", { method: "POST", body: { email } }),
      ),
    );
    expect([200, 201]).toContain(first.status);
    const second = await readJson(
      await POST(
        makeRequest("/api/newsletter", { method: "POST", body: { email } }),
      ),
    );
    expect([200, 201]).toContain(second.status);
  });

  it("rejects an invalid newsletter email with 422", async () => {
    const { POST } = await import("@/app/api/newsletter/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/newsletter", {
          method: "POST",
          body: { email: "not-an-email" },
        }),
      ),
    );
    expect(out.status).toBe(422);
  });

  it("accepts a contact message", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/contact", {
          method: "POST",
          body: {
            name: "API Tester",
            email: uniqueEmail("contact"),
            subject: "Test",
            message: "This is a test message from the API suite.",
          },
        }),
      ),
    );
    expect([200, 201]).toContain(out.status);
  });
});
