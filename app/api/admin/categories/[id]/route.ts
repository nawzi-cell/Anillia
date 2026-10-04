import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { categorySchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const updateSchema = categorySchema.partial();

async function uniqueCategorySlug(base: string, excludeId: string): Promise<string> {
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

/** Admin: update a category. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Category not found.", 404);

    const body = updateSchema.parse(await req.json());

    if (body.parentId) {
      if (body.parentId === params.id) {
        return fail("A category cannot be its own parent.", 400);
      }
      const parent = await prisma.category.findUnique({
        where: { id: body.parentId },
        select: { id: true },
      });
      if (!parent) return fail("Parent category not found.", 400);
    }

    const slug = body.slug?.trim()
      ? await uniqueCategorySlug(body.slug.trim(), params.id)
      : body.name
        ? await uniqueCategorySlug(slugify(body.name), params.id)
        : undefined;

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(body.description !== undefined
          ? { description: body.description ?? null }
          : {}),
        ...(body.image !== undefined ? { image: body.image ?? null } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId ?? null } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });

    void logAudit({
      userId: admin.id,
      action: "category.update",
      entity: "Category",
      entityId: category.id,
      ip: getClientIp(req),
    });

    return ok(category);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: delete a category (children and products are detached via SetNull). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!existing) return fail("Category not found.", 404);

    await prisma.category.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "category.delete",
      entity: "Category",
      entityId: params.id,
      metadata: { name: existing.name },
      ip: getClientIp(req),
    });

    return ok({ message: "Category deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
