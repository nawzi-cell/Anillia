import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { journalArticleSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const updateSchema = journalArticleSchema.partial();

async function uniqueJournalSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.journalArticle.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const article = await prisma.journalArticle.findUnique({
      where: { id: params.id },
    });
    if (!article) return fail("Article not found.", 404);
    return ok(article);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.journalArticle.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return fail("Article not found.", 404);

    const body = updateSchema.parse(await req.json());
    const slug = body.slug?.trim()
      ? await uniqueJournalSlug(body.slug.trim(), params.id)
      : body.title
        ? await uniqueJournalSlug(slugify(body.title), params.id)
        : undefined;

    const article = await prisma.journalArticle.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
        ...(body.image !== undefined ? { image: body.image } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.published !== undefined ? { published: body.published } : {}),
        ...(body.featured !== undefined ? { featured: body.featured } : {}),
        ...(body.publishedAt !== undefined ? { publishedAt: body.publishedAt } : {}),
      },
    });

    void logAudit({
      userId: admin.id,
      action: "journal.update",
      entity: "JournalArticle",
      entityId: article.id,
      metadata: { title: article.title, slug: article.slug },
      ip: getClientIp(req),
    });

    return ok(article);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const existing = await prisma.journalArticle.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, slug: true },
    });
    if (!existing) return fail("Article not found.", 404);

    await prisma.journalArticle.delete({ where: { id: params.id } });

    void logAudit({
      userId: admin.id,
      action: "journal.delete",
      entity: "JournalArticle",
      entityId: params.id,
      metadata: { title: existing.title, slug: existing.slug },
      ip: getClientIp(req),
    });

    return ok({ message: "Article deleted." });
  } catch (e) {
    return handleApiError(e);
  }
}
