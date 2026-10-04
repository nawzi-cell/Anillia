import { NextRequest, NextResponse } from "next/server";

// Duplicated from lib/auth/jwt on purpose: middleware runs on the Edge
// runtime and must not import jsonwebtoken (node:crypto) transitively.
const COOKIE_NAME = "anilliea_session";

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/admin/:path*"],
};

/**
 * Edge-safe presence check only: if the session cookie is missing,
 * API routes get a 401 JSON response and page routes are redirected
 * to /login?next=<path>. Full JWT verification and role checks happen
 * in the routes/pages themselves (see lib/auth/session.ts).
 */
export function middleware(req: NextRequest): NextResponse {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // TEMP-DIAG (2026-10-03): trace sign-in bounce. Remove after diagnosis.
  console.log(
    `[auth-diag] middleware: no session cookie on ${pathname} → sending back to /login`
  );

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
