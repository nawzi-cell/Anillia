/**
 * API integration tests: authentication.
 *
 * Covers register → login → me → logout plus validation, rate limiting
 * and the session-diagnostic contract.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  makeRequest,
  readJson,
  clearTestCookies,
  setTestCookie,
  registerViaApi,
  loginViaApi,
  uniqueEmail,
  sessionCookieFrom,
} from "./testkit";
import { COOKIE_NAME } from "@/lib/auth/jwt";

const PASSWORD = "TestPass123!";

beforeEach(() => {
  clearTestCookies();
});

describe("POST /api/auth/register", () => {
  it("creates a customer account and sets the session cookie", async () => {
    const email = uniqueEmail("reg");
    const out = await registerViaApi(email, PASSWORD, "Api Tester");
    expect(out.status).toBe(201);
    expect(out.json.success).toBe(true);
    expect(out.json.data.email).toBe(email);
    expect(out.json.data.role).toBe("CUSTOMER");
    expect(out.json.data).not.toHaveProperty("passwordHash");
    expect(out.cookie).toBeTruthy();
  });

  it("rejects a duplicate email with 409", async () => {
    const email = uniqueEmail("dup");
    const first = await registerViaApi(email, PASSWORD);
    expect(first.status).toBe(201);
    const second = await registerViaApi(email, PASSWORD);
    expect(second.status).toBe(409);
  });

  it("rejects a weak password with 422", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/auth/register", {
          method: "POST",
          body: { name: "Api Tester", email: uniqueEmail("weak"), password: "short" },
        }),
      ),
    );
    expect(out.status).toBe(422);
    expect(out.json.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  it("signs in with valid credentials and sets the session cookie", async () => {
    const email = uniqueEmail("login");
    await registerViaApi(email, PASSWORD);
    clearTestCookies();
    const out = await loginViaApi(email, PASSWORD);
    expect(out.status).toBe(200);
    expect(out.json.success).toBe(true);
    expect(out.json.data.email).toBe(email);
    expect(out.cookie).toBeTruthy();
  });

  it("rejects a wrong password with 401", async () => {
    const email = uniqueEmail("badpw");
    await registerViaApi(email, PASSWORD);
    clearTestCookies();
    const { POST } = await import("@/app/api/auth/login/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/auth/login", {
          method: "POST",
          body: { email, password: "WrongPass123!" },
        }),
      ),
    );
    expect(out.status).toBe(401);
    expect(out.json.message).toMatch(/invalid email or password/i);
  });

  it("rejects an unknown email with 401 (no user enumeration)", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const out = await readJson(
      await POST(
        makeRequest("/api/auth/login", {
          method: "POST",
          body: { email: uniqueEmail("ghost"), password: PASSWORD },
        }),
      ),
    );
    expect(out.status).toBe(401);
  });

  it("rate-limits repeated attempts from one IP with 429", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const ip = "10.20.30.40";
    let last = 0;
    for (let i = 0; i < 12; i++) {
      const out = await readJson(
        await POST(
          makeRequest("/api/auth/login", {
            method: "POST",
            body: { email: uniqueEmail("rl"), password: "WrongPass123!" },
            ip,
          }),
        ),
      );
      last = out.status;
    }
    expect(last).toBe(429);
  });
});

describe("GET /api/auth/me", () => {
  it("returns a plain 401 without leaking session diagnostics", async () => {
    const { GET } = await import("@/app/api/auth/me/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(401);
    expect(out.json).not.toHaveProperty("diag");
  });

  it("returns the current user when the session cookie is present", async () => {
    const email = uniqueEmail("me");
    const reg = await registerViaApi(email, PASSWORD);
    expect(reg.cookie).toBeTruthy();
    // loginViaApi installs the cookie into the mocked jar
    clearTestCookies();
    const login = await loginViaApi(email, PASSWORD);
    expect(login.cookie).toBeTruthy();

    const { GET } = await import("@/app/api/auth/me/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(200);
    expect(out.json.data.user.email).toBe(email);
    expect(out.json.data.user).not.toHaveProperty("passwordHash");
  });

  it("honours an explicitly passed session cookie", async () => {
    const email = uniqueEmail("me2");
    const reg = await registerViaApi(email, PASSWORD);
    const raw = sessionCookieFrom(reg);
    expect(raw).toBeTruthy();
    clearTestCookies();
    setTestCookie(COOKIE_NAME, raw!);

    const { GET } = await import("@/app/api/auth/me/route");
    const out = await readJson(await GET());
    expect(out.status).toBe(200);
    expect(out.json.data.user.email).toBe(email);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const email = uniqueEmail("logout");
    await registerViaApi(email, PASSWORD);
    const login = await loginViaApi(email, PASSWORD);
    expect(login.cookie).toBeTruthy();

    const { POST } = await import("@/app/api/auth/logout/route");
    const req = makeRequest("/api/auth/logout", { method: "POST" });
    const out = await readJson(await POST(req));
    expect(out.status).toBe(200);
    expect(out.setCookie ?? "").toMatch(new RegExp(`${COOKIE_NAME}=;`));
  });
});
