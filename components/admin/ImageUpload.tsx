"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { AdminButton } from "./AdminButton";
import { apiFetch } from "./admin-api";

interface ImageUploadProps {
  /** Called with the uploaded image URL on success. */
  onUploaded: (url: string) => void;
  /** Called with a human-readable message on failure. */
  onError?: (message: string) => void;
  /** Small (icon button) or full button. */
  size?: "sm" | "md";
  label?: string;
}

interface UploadResponse {
  url: string;
  storage: "vercel-blob" | "local";
}

/**
 * Admin image upload button with preview.
 *
 * Lets the admin pick an image file, shows a thumbnail preview while it
 * uploads to /api/admin/upload, then hands the resulting URL back via
 * onUploaded so the parent form can store it like any other image URL.
 */
export function ImageUpload({
  onUploaded,
  onError,
  size = "sm",
  label = "Upload",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("Please choose an image file (JPEG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image must be smaller than 5 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = (await res.json()) as
        | { success: true; data: UploadResponse }
        | { success: false; message?: string };
      if (!data.success) {
        throw new Error(data.message || "Upload failed.");
      }
      onUploaded(data.data.url);
      if (data.data.storage === "local") {
        onError?.(
          "Note: stored locally (dev only). Set BLOB_READ_WRITE_TOKEN for production uploads.",
        );
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        aria-label="Choose image to upload"
        onChange={(e) => void handleChange(e)}
      />
      {preview ? (
        <span className="relative inline-block h-10 w-10 overflow-hidden rounded-md border border-espresso/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Upload preview" className="h-full w-full object-cover" />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-espresso/40">
              <Loader2 size={16} className="animate-spin text-ivory" />
            </span>
          )}
        </span>
      ) : null}
      <AdminButton
        type="button"
        variant="secondary"
        size={size}
        icon={
          uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImagePlus size={15} />
          )
        }
        disabled={uploading}
        onClick={handlePick}
      >
        {uploading ? "Uploading…" : label}
      </AdminButton>
    </span>
  );
}

/** Small × button used to clear a previewed/uploaded image URL. */
export function ClearImageButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label="Remove image"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-espresso/15 text-espresso-muted transition hover:border-red-800 hover:text-red-800"
    >
      <X size={14} />
    </button>
  );
}
