import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { contactSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";

/** Public: submit a contact message. Rate-limited to prevent spam. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`contact:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return fail("Too many requests. Please try again later.", 429);
    }

    const body = contactSchema.parse(await req.json());

    const message = await prisma.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject ?? null,
        message: body.message,
      },
    });

    return ok({ id: message.id, message: "Message received. We'll be in touch soon." }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
