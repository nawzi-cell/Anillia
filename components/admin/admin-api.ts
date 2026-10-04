/**
 * Same-origin API helper for the admin panel.
 * The backend wraps responses in an envelope: { success: true, data } /
 * { success: false, message }. Sessions ride on cookies, so every request
 * goes with credentials: "include".
 */

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { headers, ...rest } = init;
  const res = await fetch(path, {
    credentials: "include",
    ...rest,
    headers: {
      ...(rest.method && rest.method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
  });

  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!res.ok || body?.success === false) {
    throw new AdminApiError(
      body?.message || `Request failed with status ${res.status}`,
      res.status,
    );
  }

  // Support both envelope {success,data} and raw payloads.
  if (body && "data" in body) return body.data as T;
  return body as T;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}
