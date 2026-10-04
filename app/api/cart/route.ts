import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { getCartWithTotals } from "@/lib/cart/cart";

/** Auth: current cart with items and server-computed totals. */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await requireUser();
    return ok(await getCartWithTotals(user.id));
  } catch (e) {
    return handleApiError(e);
  }
}
