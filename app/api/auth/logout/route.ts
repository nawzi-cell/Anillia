import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { ok } from "@/lib/api/response";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const res = ok({ message: "Logged out." });
  return clearSessionCookie(req, res);
}
