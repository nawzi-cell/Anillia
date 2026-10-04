import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { collectionSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

async function uniqueCollectionSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${i++}`;
  }
}

/** Admin: create a collection. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = collectionSchema.parse(await req.json());

    const slug = await uniqueCollectionSlug(
      body.slug?.trim() || slugify(body.name)
    );

    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        image: body.image ?? null,
        active: body.active,
        sortOrder: body.sortOrder,
      },
    });

    void logAudit({
      userId: admin.id,
      action: "collection.create",
      entity: "Collection",
      entityId: collection.id,
      metadata: { name: collection.name },
      ip: getClientIp(req),
    });

    return ok(collection, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
