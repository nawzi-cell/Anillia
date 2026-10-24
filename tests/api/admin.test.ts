/**
 * API integration tests: admin surface (RBAC + staff management).
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

const PASSWORD = "TestPass123!";

async function loginAsAdmin() {
  clearTestCookies();
  const out = await loginViaApi(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
  expect(out.status).toBe(200);
  expect(out.cookie).toBeTruthy();
}

async function loginAsCustomer() {
  const email = uniqueEmail("cust");
  await registerViaApi(email, PASSWORD);
  const out = await loginViaApi(email, PASSWORD);
  expect(out.status).toBe(200);
  return email;
}

beforeEach(() => {
  clearTestCookies();
});

describe("admin authorization", () => {
  it("allows the admin to list users", async () => {
    await loginAsAdmin();
    const { GET } = await import("@/app/api/admin/users/route");
    const out = await readJson(await GET(makeRequest("/api/admin/users")));
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
    expect(out.json.data.items.length).toBeGreaterThan(0);
    expect(out.json.data.items[0]).not.toHaveProperty("passwordHash");
  });

  it("forbids customers from the admin surface with 403", async () => {
    await loginAsCustomer();
    const { GET } = await import("@/app/api/admin/users/route");
    const out = await readJson(await GET(makeRequest("/api/admin/users")));
    expect(out.status).toBe(403);
  });

  it("returns 401 for unauthenticated admin access", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const out = await readJson(
      await GET(makeRequest("/api/admin/users", { cookie: null })),
    );
    expect(out.status).toBe(401);
  });

  it("serves the admin dashboard to admins", async () => {
    await loginAsAdmin();
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
  });
});

describe("admin inventory", () => {
  it("returns paginated rows with the flags and sku the table renders", async () => {
    await loginAsAdmin();
    const { GET } = await import("@/app/api/admin/inventory/route");
    const out = await readJson(
      await GET(makeRequest("/api/admin/inventory?limit=100")),
    );
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
    expect(Array.isArray(out.json.data.items)).toBe(true);
    expect(out.json.data.items.length).toBeGreaterThan(0);
    expect(out.json.data).toEqual(
      expect.objectContaining({
        page: 1,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        lowStockCount: expect.any(Number),
      }),
    );
    expect(out.json.data.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        sku: expect.any(String),
        quantity: expect.any(Number),
        reserved: expect.any(Number),
        available: expect.any(Number),
        lowStockThreshold: expect.any(Number),
        isLow: expect.any(Boolean),
        product: expect.objectContaining({ name: expect.any(String) }),
      }),
    );
  });

  it("filters low-stock rows and keeps the global low-stock count", async () => {
    await loginAsAdmin();
    const { GET } = await import("@/app/api/admin/inventory/route");
    const all = await readJson(
      await GET(makeRequest("/api/admin/inventory?limit=100")),
    );
    const low = await readJson(
      await GET(
        makeRequest("/api/admin/inventory?limit=100&lowStock=true"),
      ),
    );
    expect(low.status).toBe(200);
    expect(low.json.data.items.every((r: { isLow: boolean }) => r.isLow)).toBe(
      true,
    );
    expect(low.json.data.total).toBe(all.json.data.lowStockCount);
  });

  it("accepts an admin quantity update and rejects customers", async () => {
    await loginAsAdmin();
    const target = await prisma.inventory.findFirstOrThrow();
    const { PUT } = await import("@/app/api/admin/inventory/[id]/route");
    const out = await readJson(
      await PUT(
        makeRequest(`/api/admin/inventory/${target.id}`, {
          method: "PUT",
          body: { quantity: target.quantity, lowStockThreshold: target.lowStockThreshold },
        }),
        { params: { id: target.id } },
      ),
    );
    expect(out.status).toBe(200);
    expect(out.json.data.quantity).toBe(target.quantity);

    await loginAsCustomer();
    const forbidden = await readJson(
      await PUT(
        makeRequest(`/api/admin/inventory/${target.id}`, {
          method: "PUT",
          body: { quantity: target.quantity },
        }),
        { params: { id: target.id } },
      ),
    );
    expect(forbidden.status).toBe(403);
  });
});

describe("Single-admin enforcement and staff policy", () => {
  it("enforces single-admin policy: prevents creating additional administrators", async () => {
    await loginAsAdmin();
    const email = uniqueEmail("staff");
    await registerViaApi(email, PASSWORD);
    const target = await prisma.user.findUniqueOrThrow({ where: { email } });

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const promote = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${target.id}`, {
          method: "PATCH",
          body: { role: "ADMIN" },
        }),
        { params: { id: target.id } },
      ),
    );
    expect(promote.status).toBe(400);
    expect(promote.json.message).toMatch(/single-admin policy enabled/i);
  });

  it("blocks an admin from changing their own role", async () => {
    await loginAsAdmin();
    const me = await prisma.user.findFirstOrThrow({
      where: { role: "ADMIN" },
    });
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const out = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${me.id}`, {
          method: "PATCH",
          body: { role: "CUSTOMER" },
        }),
        { params: { id: me.id } },
      ),
    );
    expect(out.status).toBe(403);
  });

  it("admin can change their email with valid password and rejects bad password", async () => {
    await loginAsAdmin();
    const { POST } = await import("@/app/api/admin/change-email/route");
    const newEmail = uniqueEmail("adminnew");

    // Rejects bad current password
    const badPw = await readJson(
      await POST(
        makeRequest("/api/admin/change-email", {
          method: "POST",
          body: { newEmail, currentPassword: "WrongPassword123!" },
        }),
      ),
    );
    expect(badPw.status).toBe(401);

    // Rejects if customer attempts to access
    await loginAsCustomer();
    const custAttempt = await readJson(
      await POST(
        makeRequest("/api/admin/change-email", {
          method: "POST",
          body: { newEmail, currentPassword: PASSWORD },
        }),
      ),
    );
    expect(custAttempt.status).toBe(403);

    // Succeeds for admin with correct password
    await loginAsAdmin();
    const success = await readJson(
      await POST(
        makeRequest("/api/admin/change-email", {
          method: "POST",
          body: { newEmail, currentPassword: TEST_ADMIN_PASSWORD },
        }),
      ),
    );
    expect(success.status).toBe(200);
    expect(success.json.data.email).toBe(newEmail);

    // Revert back so other tests continue seamlessly
    const revert = await readJson(
      await POST(
        makeRequest("/api/admin/change-email", {
          method: "POST",
          body: { newEmail: TEST_ADMIN_EMAIL, currentPassword: TEST_ADMIN_PASSWORD },
        }),
      ),
    );
    expect(revert.status).toBe(200);
  });

  it("returns 404 for an unknown user id", async () => {
    await loginAsAdmin();
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const out = await readJson(
      await PATCH(
        makeRequest("/api/admin/users/00000000-0000-0000-0000-000000000000", {
          method: "PATCH",
          body: { role: "ADMIN" },
        }),
        { params: { id: "00000000-0000-0000-0000-000000000000" } },
      ),
    );
    expect(out.status).toBe(404);
  });
});
