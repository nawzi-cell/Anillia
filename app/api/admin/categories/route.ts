import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { categorySchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

/** Admin: create a category. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = categorySchema.parse(await req.json());

    if (body.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: body.parentId },
        select: { id: true },
      });
      if (!parent) return fail("Parent category not found.", 400);
    }

    const slug = await uniqueCategorySlug(body.slug?.trim() || slugify(body.name));

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        image: body.image ?? null,
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder,
        active: body.active,
      },
    });

    void logAudit({
      userId: admin.id,
      action: "category.create",
      entity: "Category",
      entityId: category.id,
      metadata: { name: category.name },
      ip: getClientIp(req),
    });

    return ok(category, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
