import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit/log";
import { getClientIp } from "@/lib/utils/request";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Reject files whose bytes are not actually an allowed image type. */
function hasValidSignature(mime: string, bytes: Buffer): boolean {
  switch (mime) {
    case "image/jpeg":
      return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes.length > 8 &&
        bytes.subarray(0, 8).equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        )
      );
    case "image/gif": {
      const header = bytes.subarray(0, 6).toString("ascii");
      return header === "GIF87a" || header === "GIF89a";
    }
    case "image/webp":
      return (
        bytes.length > 12 &&
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

/**
 * Admin image upload.
 *
 * Accepts multipart/form-data with a single `file` field.
 * - Validates MIME type and size on the server.
 * - Stores with a random filename (never trusts the client filename).
 * - Production: uploads to Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * - Local dev fallback: writes to public/uploads/ (ephemeral on hosts like
 *   Vercel — never rely on it in production).
 *
 * Returns { url, storage: "vercel-blob" | "local" }.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return fail("No file provided. Send multipart form data with a `file` field.", 400);
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return fail(
        "Unsupported image type. Allowed: JPEG, PNG, WebP, GIF.",
        400,
      );
    }

    if (file.size === 0) {
      return fail("The uploaded file is empty.", 400);
    }

    if (file.size > MAX_SIZE_BYTES) {
      return fail("Image must be smaller than 5 MB.", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(file.type, bytes)) {
      return fail("The file contents do not match an allowed image type.", 400);
    }

    const filename = `${randomUUID()}.${ext}`;
    let url: string;
    let storage: "vercel-blob" | "local";

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`anilliea/${filename}`, bytes, {
        access: "public",
        token: blobToken,
        contentType: file.type,
      });
      url = blob.url;
      storage = "vercel-blob";
    } else {
      // Local development fallback only.
      const dir = join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, filename), bytes);
      url = `/uploads/${filename}`;
      storage = "local";
    }

    void logAudit({
      userId: admin.id,
      action: "media.upload",
      entity: "Media",
      entityId: filename,
      metadata: { url, storage, size: file.size, mime: file.type },
      ip: getClientIp(req),
    });

    return ok({ url, storage });
  } catch (e) {
    return handleApiError(e);
  }
}
