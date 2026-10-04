import { NextResponse } from "next/server";

/**
 * Standard API envelope helpers.
 * Success: { success: true, data }
 * Failure: { success: false, message, errors? }
 */

/** 200/201 JSON response: { success: true, data }. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/** Error JSON response: { success: false, message, errors? }. */
export function fail(
  message: string,
  status = 400,
  errors?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors !== undefined ? { errors } : {}),
    },
    { status }
  );
}

/** Paginated JSON response: { success: true, data: { items, page, limit, total, totalPages } }. */
export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data: {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
