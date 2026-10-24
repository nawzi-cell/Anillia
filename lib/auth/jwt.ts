import jwt from "jsonwebtoken";

/** Name of the httpOnly session cookie. */
export const COOKIE_NAME = "anilliea_session";

const DEV_FALLBACK_SECRET = "anilliea-dev-secret-change-me";
const EXPIRES_IN = "7d" as const;

/**
 * Read the signing secret lazily so `next build` does not fail when the
 * variable is absent at build time. Production refuses to sign with the
 * well-known development fallback: doing so would let anyone forge a
 * session for any account.
 */
function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }
  return DEV_FALLBACK_SECRET;
}

export interface TokenPayload {
  sub: string;
  role: string;
}

/** Sign a session JWT (7-day expiry by default). */
export function signToken(
  payload: TokenPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = EXPIRES_IN
): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn });
}

/** Verify a session JWT. Returns the payload, or null if invalid/expired. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as jwt.JwtPayload &
      TokenPayload;
    if (typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
      return null;
    }
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}
