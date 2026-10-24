import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Operator diagnostics. Disabled in production unless DIAG_TOKEN is set
 * and supplied as `Authorization: Bearer <token>`; non-production runs
 * may use it without a token. Returns booleans and counts only — never
 * connection strings, error dumps, PII or secrets.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.DIAG_TOKEN?.trim();
  const supplied = req.headers.get("authorization") ?? "";
  const allowed =
    expected !== undefined && expected !== ""
      ? supplied === `Bearer ${expected}`
      : process.env.NODE_ENV !== "production";
  if (!allowed) {
    return new NextResponse(null, { status: 404 });
  }

  const report: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      ADMIN_EMAIL: !!process.env.ADMIN_EMAIL?.trim(),
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      SMTP_HOST: !!process.env.SMTP_HOST?.trim(),
    },
    db: {},
    jwt: {},
    req: {
      https:
        process.env.VERCEL === "1" ||
        (req.headers.get("x-forwarded-proto") ?? "")
          .split(",")[0]
          .trim()
          .toLowerCase() === "https" ||
        req.nextUrl.protocol === "https:",
      cookiePresent: req.cookies.get("anilliea_session") !== undefined,
    },
  };

  try {
    const { signToken, verifyToken } = await import("@/lib/auth/jwt");
    const token = signToken({ sub: "diag", role: "DIAG" }, "60s");
    (report.jwt as Record<string, unknown>).signAndVerify =
      verifyToken(token)?.sub === "diag";
  } catch {
    (report.jwt as Record<string, unknown>).signAndVerify = false;
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$queryRaw`SELECT 1`;
    const [users, products, admins] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);
    report.db = { reachable: true, tablesExist: true, counts: { users, products }, adminCount: admins };
  } catch (e) {
    const code = (e as { code?: string }).code;
    report.db = { reachable: false, ...(code ? { code } : {}) };
  }

  const env = report.env as Record<string, boolean>;
  const db = report.db as Record<string, unknown>;
  report.ok =
    env.DATABASE_URL &&
    env.JWT_SECRET &&
    db.reachable === true &&
    (report.jwt as Record<string, unknown>).signAndVerify === true;

  return NextResponse.json(report, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
