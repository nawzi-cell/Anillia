import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./jwt";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

/** Authenticated user shape returned by session helpers (never includes passwordHash). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Strip sensitive fields from a user record. */
export function toUserDTO(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * TEMP-DIAG (2026-10-03): fine-grained session check used to diagnose the
 * sign-in bounce. Returns WHY the session is unusable instead of just null.
 * Remove once resolved.
 */
export type SessionDiag = "OK" | "NO_COOKIE" | "BAD_TOKEN" | "NO_USER" | "ERROR";

export async function getSessionDiag(): Promise<{
  diag: SessionDiag;
  user: SessionUser | null;
}> {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) {
      console.log("[auth-diag] session check: NO cookie in request");
      return { diag: "NO_COOKIE", user: null };
    }
    const payload = verifyToken(token);
    if (!payload) {
      console.log("[auth-diag] session check: cookie present but JWT invalid");
      return { diag: "BAD_TOKEN", user: null };
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      console.log(
        `[auth-diag] session check: JWT valid but user ${payload.sub} not in DB`
      );
      return { diag: "NO_USER", user: null };
    }
    return { diag: "OK", user };
  } catch (e) {
    console.log("[auth-diag] session check: EXCEPTION", e);
    return { diag: "ERROR", user: null };
  }
};

/**
 * Read the session cookie, verify the JWT, and fetch the user
 * (without passwordHash). Returns null when there is no session,
 * the token is invalid/expired, or the user no longer exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const { user } = await getSessionDiag();
  return user;
}

/** Return the current user, or throw ApiError(401). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}

/** Return the current admin user, or throw ApiError(401/403). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  assertRole(user, "ADMIN");
  return user;
}

/**
 * Pure role assertion used by unit tests.
 * Throws ApiError(401) when there is no user, ApiError(403) when the
 * user's role does not match.
 */
export function assertRole(
  user: { role: string } | null,
  role: "ADMIN"
): void {
  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.role !== role) throw new ApiError(403, "Forbidden");
}
