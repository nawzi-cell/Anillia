import { NextResponse } from "next/server";

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
 *
 * Safe to expose: returns only true/false/counts, never secret values,
 * connection strings, or user data. Used to diagnose "auth broken on
 * Vercel" without needing dashboard access.
 */
export async function GET(): Promise<NextResponse> {
  const report: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    env: {},
    db: {},
    jwt: {},
  };

  // --- Environment variables (presence only) -------------------------------
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
    (report.db as Record<string, unknown>).error =
      e instanceof Error ? e.message.split("\n")[0] : "unknown";
  }

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
