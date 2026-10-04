import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { newsletterSchema } from "@/lib/validation/schemas";

/** Public: subscribe to the newsletter (upsert, reactivates). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = newsletterSchema.parse(await req.json());

    await prisma.newsletterSubscriber.upsert({
      where: { email: body.email },
      update: { active: true },
      create: { email: body.email, active: true },
    });

    return ok({ message: "Subscribed. Welcome to ANILLIÉA." });
  } catch (e) {
    return handleApiError(e);
  }
}
