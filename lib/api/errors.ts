import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/** Application error carrying an HTTP status code. */
export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Convert any thrown error into a safe NextResponse.
 * - ApiError -> its status and message
 * - ZodError -> 422 with validation details
 * - Prisma unique-constraint violation (P2002) -> 409
 * - Anything else -> 500 with a generic message (stack is never leaked)
 */
export function handleApiError(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: e.message,
        ...(e.errors !== undefined ? { errors: e.errors } : {}),
      },
      { status: e.status }
    );
  }

  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: e.flatten(),
      },
      { status: 422 }
    );
  }

  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    return NextResponse.json(
      { success: false, message: "A record with these values already exists." },
      { status: 409 }
    );
  }

  console.error("[api] Unhandled error:", e);
  return NextResponse.json(
    { success: false, message: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
