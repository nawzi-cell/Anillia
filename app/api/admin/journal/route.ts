import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ok, paginated } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { journalArticleSchema, paginationSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/format";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

const listQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  published: z
    .preprocess((v) => {
      if (v === "true" || v === true) return true;
      if (v === "false" || v === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});

async function uniqueJournalSlug(base: string, excludeId?: string): Promise<string> {
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

/** Admin: list journal articles including drafts. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const q = listQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );

    const where: Prisma.JournalArticleWhereInput = {
      ...(q.published !== undefined ? { published: q.published } : {}),
      ...(q.search
        ? {
            OR: [
              { title: { contains: q.search, mode: "insensitive" as const } },
              { slug: { contains: q.search, mode: "insensitive" as const } },
              { excerpt: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, articles] = await Promise.all([
      prisma.journalArticle.count({ where }),
      prisma.journalArticle.findMany({
        where,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return paginated(articles, q.page, q.limit, total);
  } catch (e) {
    return handleApiError(e);
  }
}

/** Admin: create a journal article. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const body = journalArticleSchema.parse(await req.json());
    const slug = await uniqueJournalSlug(body.slug?.trim() || slugify(body.title));

    const article = await prisma.journalArticle.create({
      data: {
        title: body.title,
        slug,
        excerpt: body.excerpt,
        image: body.image,
        content: body.content,
        published: body.published,
        featured: body.featured,
        publishedAt: body.publishedAt,
      },
    });

    void logAudit({
      userId: admin.id,
      action: "journal.create",
      entity: "JournalArticle",
      entityId: article.id,
      metadata: { title: article.title, slug: article.slug },
      ip: getClientIp(req),
    });

    return ok(article, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
