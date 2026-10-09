/**
 * Test kit for API integration tests.
 *
 * IMPORTANT: every API test file must import from this module FIRST, before
 * any route handler import. The `vi.mock("next/headers")` call below is
 * hoisted to the top of this module, so the session helpers
 * (`lib/auth/session.ts`) see the mocked cookie jar instead of throwing
 * outside the Next.js runtime.
 *
 * Route handlers are invoked directly (no HTTP server needed). Auth state
 * flows through the mocked `next/headers` cookie store, exactly like the
 * real `anilliea_session` httpOnly cookie.
 */
import { vi } from "vitest";
import { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/jwt";

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll: () =>
      Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
    has: (name: string) => jar.has(name),
    set: () => {},
    delete: () => {},
  }),
  headers: () => new Headers(),
  draftMode: () => ({ isEnabled: false, enable: () => {}, disable: () => {} }),
}));

/** Put a cookie into the mocked request cookie jar. */
export function setTestCookie(name: string, value: string): void {
  jar.set(name, value);
}

/** Empty the mocked request cookie jar (i.e. "logged out"). */
export function clearTestCookies(): void {
  jar.clear();
}

/** Install a session cookie value as the current request's session. */
export function useSessionCookie(cookieValue: string | null): void {
  clearTestCookies();
  if (cookieValue) setTestCookie(COOKIE_NAME, cookieValue);
}

function testCookieHeader(): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export interface CallOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override the Cookie header; null sends none. Defaults to the jar. */
  cookie?: string | null;
  /** Override client IP (rate limiting is per-IP; default is unique). */
  ip?: string;
}

function randomIp(): string {
  const n = () => Math.floor(Math.random() * 250) + 1;
  return `10.99.${n()}.${n()}`;
}

/** Build a NextRequest the way the app's client would send it. */
export function makeRequest(path: string, opts: CallOpts = {}): NextRequest {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined) headers.set("Content-Type", "application/json");
  const cookieHeader =
    opts.cookie === null ? "" : (opts.cookie ?? testCookieHeader());
  if (cookieHeader) headers.set("cookie", cookieHeader);
  headers.set("x-forwarded-for", opts.ip ?? randomIp());
  return new NextRequest(`http://localhost:3000${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

export interface ReadResult {
  status: number;
  json: any;
  setCookie: string | null;
}

/** Read a route handler's NextResponse into plain data. */
export async function readJson(res: Response): Promise<ReadResult> {
  const json = await res.json().catch(() => null);
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

/** Pull the session JWT out of a login/register Set-Cookie header. */
export function sessionCookieFrom(res: ReadResult): string | null {
  if (!res.setCookie) return null;
  const m = res.setCookie.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

/** Unique email per test so suites never collide on the shared test DB. */
export function uniqueEmail(prefix = "apitest"): string {
  const s = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${s}@example.com`;
}

export interface AuthResult extends ReadResult {
  cookie: string | null;
}

/** Register a user through POST /api/auth/register. */
export async function registerViaApi(
  email: string,
  password: string,
  name = "API Tester",
): Promise<AuthResult> {
  const { POST } = await import("@/app/api/auth/register/route");
  const out = await readJson(
    await POST(
      makeRequest("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      }),
    ),
  );
  return { ...out, cookie: sessionCookieFrom(out) };
}

/**
 * Log in through POST /api/auth/login and install the session cookie into
 * the mocked jar, so subsequent handler calls run as this user.
 */
export async function loginViaApi(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { POST } = await import("@/app/api/auth/login/route");
  const out = await readJson(
    await POST(
      makeRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    ),
  );
  const cookie = sessionCookieFrom(out);
  useSessionCookie(cookie);
  return { ...out, cookie };
}
