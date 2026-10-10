import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, getSessionDiag, requireUser, toUserDTO } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { updateProfileSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(): Promise<NextResponse> {
  try {
    // TEMP-DIAG (2026-10-03): return the precise failure reason so the
    // login page can tell the user exactly what went wrong. Remove after.
    const { diag, user } = await getSessionDiag();
    if (diag !== "OK" || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", diag },
        { status: 401, headers: NO_STORE }
      );
    }
    const res = ok(toUserDTO(user));
    Object.entries(NO_STORE).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = updateProfileSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
      },
    });

    return ok(toUserDTO(updated));
  } catch (e) {
    return handleApiError(e);
  }
}
