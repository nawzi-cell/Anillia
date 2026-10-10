import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError, ApiError } from "@/lib/api/errors";
import { addressSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOwnAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!address) throw new ApiError(404, "Address not found.");
  return address;
}

/** Auth: list own addresses (default first). */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return ok(addresses);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Auth: add an address. First address becomes default automatically. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = addressSchema.parse(await req.json());

    const existingCount = await prisma.address.count({
      where: { userId: user.id },
    });
    const isDefault = body.isDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId: user.id,
          label: body.label,
          fullName: body.fullName,
          phone: body.phone,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2 ?? null,
          city: body.city,
          province: body.province,
          postalCode: body.postalCode ?? null,
          country: body.country,
          isDefault,
        },
      });
    });

    return ok(address, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
