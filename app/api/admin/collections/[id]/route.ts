import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { collectionSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateSchema = collectionSchema.partial();

async function uniqueCollectionSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

/** Admin: update a collection. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.collection.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Collection not found.", 404);

    const body = updateSchema.parse(await req.json());

    const slug = body.slug?.trim()
      ? await uniqueCollectionSlug(body.slug.trim(), params.id)
      : body.name
        ? await uniqueCollectionSlug(slugify(body.name), params.id)
        : undefined;

    const collection = await prisma.collection.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(body.description !== undefined
          ? { description: body.description ?? null }
          : {}),
        ...(body.image !== undefined ? { image: body.image ?? null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });

    void logAudit({
      userId: admin.id,
      action: "collection.update",
      entity: "Collection",
      entityId: collection.id,
      ip: getClientIp(req),
    });

    return ok(collection);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a collection (product links are removed via cascade). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.collection.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!existing) return fail("Collection not found.", 404);

    await prisma.collection.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "collection.delete",
      entity: "Collection",
      entityId: params.id,
      metadata: { name: existing.name },
      ip: getClientIp(req),
    });

    return ok({ message: "Collection deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
