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

describe("PATCH /api/admin/users/[id] (staff & access)", () => {
  it("promotes a customer to ADMIN and demotes back to CUSTOMER", async () => {
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
    expect(promote.status).toBe(200);
    expect(promote.json.data.role).toBe("ADMIN");

    const demote = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${target.id}`, {
          method: "PATCH",
          body: { role: "CUSTOMER" },
        }),
        { params: { id: target.id } },
      ),
    );
    expect(demote.status).toBe(200);
    expect(demote.json.data.role).toBe("CUSTOMER");
  });

  it("blocks an admin from changing their own role", async () => {
    await loginAsAdmin();
    const me = await prisma.user.findUniqueOrThrow({
      where: { email: TEST_ADMIN_EMAIL },
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

  it("keeps at least one admin: self-demotion is refused", async () => {
    await loginAsAdmin();
    // Create a second admin, then demote them so exactly one admin is left.
    const email = uniqueEmail("secondadmin");
    await registerViaApi(email, PASSWORD);
    const second = await prisma.user.findUniqueOrThrow({ where: { email } });
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const promote = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${second.id}`, {
          method: "PATCH",
          body: { role: "ADMIN" },
        }),
        { params: { id: second.id } },
      ),
    );
    expect(promote.status).toBe(200);
    const demote = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${second.id}`, {
          method: "PATCH",
          body: { role: "CUSTOMER" },
        }),
        { params: { id: second.id } },
      ),
    );
    expect(demote.status).toBe(200);

    // Now only the seeded admin remains — they cannot demote themselves,
    // so the shop can never end up with zero admins.
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    expect(adminCount).toBe(1);
    const lastAdmin = await prisma.user.findUniqueOrThrow({
      where: { email: TEST_ADMIN_EMAIL },
    });
    const blocked = await readJson(
      await PATCH(
        makeRequest(`/api/admin/users/${lastAdmin.id}`, {
          method: "PATCH",
          body: { role: "CUSTOMER" },
        }),
        { params: { id: lastAdmin.id } },
      ),
    );
    expect(blocked.status).toBe(403);
    expect(await prisma.user.count({ where: { role: "ADMIN" } })).toBe(1);
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
