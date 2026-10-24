import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

import { handleApiError } from "@/lib/api/errors";
import { newsletterSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import { ok, fail } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public: subscribe to the newsletter (upsert, reactivates). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rl = rateLimit(`newsletter:${getClientIp(req)}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return fail("Too many requests. Please try again later.", 429);

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
