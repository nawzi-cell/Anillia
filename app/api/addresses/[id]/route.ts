import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { addressSchema } from "@/lib/validation/schemas";

async function getOwnAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!address) throw new ApiError(404, "Address not found.");
  return address;
}

/** Auth: update one of your own addresses. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const existing = await getOwnAddress(user.id, params.id);
    const body = addressSchema.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault && !existing.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: existing.id },
        data: {
          label: body.label,
          fullName: body.fullName,
          phone: body.phone,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2 ?? null,
          city: body.city,
          province: body.province,
          postalCode: body.postalCode ?? null,
          country: body.country,
          isDefault: body.isDefault,
        },
      });
    });

    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Auth: delete one of your own addresses. Deleting the default reassigns. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const existing = await getOwnAddress(user.id, params.id);

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: existing.id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return ok({ message: "Address deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
