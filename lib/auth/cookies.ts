import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "./jwt";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

/**
 * Decide the Secure flag from the actual incoming request, NOT from
 * NODE_ENV. A Secure cookie sent over plain http is silently discarded by
 * browsers — the old NODE_ENV-based heuristic broke sign-in whenever the
 * server ran in production mode (npm start, or NODE_ENV=production set
 * globally) while the site was opened over http://localhost or any other
 * plain-http URL. When the scheme is unknown we err on the side of NOT
 * setting Secure: omitting it on https still works, but setting it on http
 * always breaks.
 *
 * Vercel override: Vercel production is always served over HTTPS, so when
 * running on Vercel we always set Secure. (Vercel sets VERCEL=1.)
 */
function isSecureRequest(req: NextRequest): boolean {
  if (process.env.VERCEL === "1") return true;
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) {
    return proto.split(",")[0].trim().toLowerCase() === "https";
  }
  try {
    if (req.nextUrl.protocol === "https:") return true;
  } catch {
    // ignore URL parse failures
  }
  return false;
}

function cookieOptions(req: NextRequest) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: isSecureRequest(req),
  };
}

/** Set the session cookie on a response (7-day expiry). */
export function setSessionCookie(
  req: NextRequest,
  res: NextResponse,
  token: string
): NextResponse {
  const opts = cookieOptions(req);
  res.cookies.set(COOKIE_NAME, token, {
    ...opts,
    maxAge: SEVEN_DAYS_SECONDS,
  });
  return res;
}

/** Clear the session cookie on a response. */
export function clearSessionCookie(
  req: NextRequest,
  res: NextResponse
): NextResponse {
  res.cookies.set(COOKIE_NAME, "", {
    ...cookieOptions(req),
    maxAge: 0,
  });
  return res;
}
