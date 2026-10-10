import { NextRequest, NextResponse } from "next/server";

/**
 * Production diagnostics — no secrets, no PII, booleans only.
 *
 * GET /api/diag
 *
 * Reports whether the production environment is correctly configured for
 * authentication:
 *   - env:  whether required environment variables are present
 *   - db:   whether the database is reachable and the core tables exist
 *   - jwt:  whether JWT signing works
 *   - req:  what the server sees about the incoming request (protocol
 *            headers) — used to diagnose cookie Secure-flag issues
 *
 * Safe to expose: returns only true/false/counts, never secret values,
 * connection strings, or user data. Used to diagnose "auth broken on
 * Vercel" without needing dashboard access.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const report: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    env: {},
    db: {},
    jwt: {},
    req: {},
  };

  // --- Environment variables (presence only) -------------------------------
  const rawDbUrl = process.env.DATABASE_URL || "";
  const envCheck: Record<string, boolean> = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    ADMIN_EMAIL: !!(
      process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim() !== ""
    ),
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
  };
  report.env = envCheck;
  // Non-sensitive shape hints for the DB URL (never the value itself).
  (report.db as Record<string, unknown>).urlHint = {
    length: rawDbUrl.length,
    protocol: rawDbUrl.split("://")[0] || "(none)",
    hasAtSign: rawDbUrl.includes("@"),
    hasWhitespace: /\s/.test(rawDbUrl),
    startsWithQuote: /^["']/.test(rawDbUrl.trim()),
  };

  // --- JWT ------------------------------------------------------------------
  try {
    // Dynamic import so a missing JWT_SECRET throws here, not at module load.
    const { signToken, verifyToken } = await import("@/lib/auth/jwt");
    const token = signToken({ sub: "diag", role: "DIAG" }, "60s");
    const payload = verifyToken(token);
    (report.jwt as Record<string, unknown>).signAndVerify =
      payload?.sub === "diag";
  } catch (e) {
    (report.jwt as Record<string, unknown>).signAndVerify = false;
    (report.jwt as Record<string, unknown>).error =
      e instanceof Error ? e.message : "unknown";
  }

  // --- Database ---------------------------------------------------------------
  try {
    const { prisma } = await import("@/lib/db/prisma");
    // 1. Can we reach the database at all?
    await prisma.$queryRaw`SELECT 1`;
    (report.db as Record<string, unknown>).reachable = true;

    // 2. Do the core tables exist? (counts only, no row data)
    try {
      const [users, products, journal] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.journalArticle.count(),
      ]);
      (report.db as Record<string, unknown>).tablesExist = true;
      (report.db as Record<string, unknown>).counts = {
        users,
        products,
        journalArticles: journal,
      };
      // 3. Is there an admin account?
      const admins = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      (report.db as Record<string, unknown>).adminCount = admins;
    } catch (e) {
      (report.db as Record<string, unknown>).tablesExist = false;
      (report.db as Record<string, unknown>).error =
        e instanceof Error ? e.message.split("\n")[0] : "unknown";
    }
  } catch (e) {
    (report.db as Record<string, unknown>).reachable = false;
    const err = e as { message?: string; code?: string; meta?: unknown };
    const dbReport = report.db as Record<string, unknown>;
    dbReport.error =
      (typeof err.message === "string" && err.message.split("\n")[0].trim()) ||
      "unknown";
    if (typeof err.code === "string") {
      dbReport.code = err.code;
    }
    // Verbose fallback: capture whatever the thrown value actually is,
    // since some runtimes swallow Error details (empty message, no code).
    try {
      dbReport.errorType =
        e === null ? "null" : e === undefined ? "undefined" : typeof e;
      const ctor = (e as { constructor?: { name?: string } })?.constructor;
      if (ctor?.name) dbReport.errorName = ctor.name;
      const asString = String(e);
      if (asString && asString !== "[object Object]") {
        dbReport.errorString = asString.slice(0, 300);
      }
      dbReport.errorJson = JSON.stringify(e).slice(0, 500);
    } catch {
      // ignore introspection failures
    }
  }

  // --- Request / protocol visibility -------------------------------------------
  // Helps diagnose cookie Secure-flag issues: reports what the server sees,
  // and whether the session cookie would be set with Secure=true.
  const fwdProto = req.headers.get("x-forwarded-proto");
  const vercelEnv = process.env.VERCEL === "1";
  (report.req as Record<string, unknown>).xForwardedProto = fwdProto;
  (report.req as Record<string, unknown>).vercelEnv = vercelEnv;
  (report.req as Record<string, unknown>).urlProtocol = req.nextUrl.protocol;
  (report.req as Record<string, unknown>).cookieWouldBeSecure =
    vercelEnv ||
    (fwdProto !== null &&
      fwdProto.split(",")[0].trim().toLowerCase() === "https") ||
    req.nextUrl.protocol === "https:";
  (report.req as Record<string, unknown>).cookiePresent =
    req.cookies.get("anilliea_session") !== undefined;

  const env = report.env as Record<string, boolean>;
  const db = report.db as Record<string, unknown>;
  const jwt = report.jwt as Record<string, unknown>;
  report.ok =
    env.DATABASE_URL === true &&
    env.JWT_SECRET === true &&
    db.reachable === true &&
    db.tablesExist === true &&
    jwt.signAndVerify === true;

  return NextResponse.json(report, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
