import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

/** Public: list active categories with their children, ordered. */
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true, parentId: null },
      include: {
        children: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            sortOrder: true,
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return ok(categories);
  } catch (e) {
    return handleApiError(e);
  }
}
