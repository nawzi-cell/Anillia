import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";

/** Public: list active collections, ordered. */
export async function GET(): Promise<NextResponse> {
  try {
    const collections = await prisma.collection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(collections);
  } catch (e) {
    return handleApiError(e);
  }
}
