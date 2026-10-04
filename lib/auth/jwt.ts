import jwt from "jsonwebtoken";

/** Name of the httpOnly session cookie. */
export const COOKIE_NAME = "anilliea_session";

const JWT_SECRET = process.env.JWT_SECRET || "anilliea-dev-secret-change-me";
const EXPIRES_IN = "7d" as const;

export interface TokenPayload {
  sub: string;
  role: string;
}

/** Sign a session JWT (7-day expiry by default). */
export function signToken(
  payload: TokenPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = EXPIRES_IN
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/** Verify a session JWT. Returns the payload, or null if invalid/expired. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload &
      TokenPayload;
    if (typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
      return null;
    }
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}
