import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, requireUser, toUserDTO } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { updateProfileSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized.", 401);

    const res = ok({ user: toUserDTO(user) });
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

    return ok({ user: toUserDTO(updated) });
  } catch (e) {
    return handleApiError(e);
  }
}
