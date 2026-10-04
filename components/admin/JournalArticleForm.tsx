"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { apiFetch } from "./admin-api";
import { slugify } from "./format";
import { useToast } from "./Toast";
import { AdminInput } from "./AdminInput";
import { AdminTextarea } from "./AdminTextarea";
import { AdminButton } from "./AdminButton";
import { AdminCard } from "./AdminCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { LoadingState, ErrorState } from "./Spinner";
import type { JournalArticleFull } from "./types";

interface JournalArticleFormProps {
  articleId?: string;
}

function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function paragraphsFromText(value: string): string[] {
  return value
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function JournalArticleForm({ articleId }: JournalArticleFormProps) {
  const isEdit = Boolean(articleId);
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [image, setImage] = useState("/images/journal-1.svg");
  const [publishedAt, setPublishedAt] = useState(toDateInput(null));
  const [contentText, setContentText] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);

  const slugSuggestion = useMemo(() => slugify(title), [title]);

  const load = async () => {
    if (!articleId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const article = await apiFetch<JournalArticleFull>(
        `/api/admin/journal/${articleId}`,
      );
      setTitle(article.title ?? "");
      setSlug(article.slug ?? "");
      setSlugTouched(true);
      setExcerpt(article.excerpt ?? "");
      setImage(article.image ?? "");
      setPublishedAt(toDateInput(article.publishedAt));
      setContentText((article.content ?? []).join("\n\n"));
      setPublished(Boolean(article.published));
      setFeatured(Boolean(article.featured));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load article.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = paragraphsFromText(contentText);
    if (!title.trim()) {
      error("Article title is required.");
      return;
    }
    if (!excerpt.trim()) {
      error("Excerpt is required.");
      return;
    }
    if (!image.trim()) {
      error("Image URL is required.");
      return;
    }
    if (content.length === 0) {
      error("Write at least one paragraph.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugSuggestion,
        excerpt: excerpt.trim(),
        image: image.trim(),
        content,
        published,
        featured,
        publishedAt,
      };

      if (isEdit) {
        await apiFetch(`/api/admin/journal/${articleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        success("Article updated.");
      } else {
        await apiFetch("/api/admin/journal", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        success("Article created.");
      }
      router.push("/admin/journal");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/journal/${articleId}`, { method: "DELETE" });
      success("Article deleted.");
      router.push("/admin/journal");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to delete article.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminCard>
        <LoadingState label="Loading article..." />
      </AdminCard>
    );
  }

  if (loadError) {
    return (
      <AdminCard>
        <ErrorState message={loadError} onRetry={() => void load()} />
      </AdminCard>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <AdminCard
          title={isEdit ? "Article details" : "New article"}
          subtitle="Publishing details for the public Journal."
        >
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="How to style a travel-ready hijab capsule"
                required
              />
              <AdminInput
                label="Slug"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="travel-ready-hijab-capsule"
                hint={
                  !slugTouched && slugSuggestion
                    ? `Auto-suggested: ${slugSuggestion}`
                    : undefined
                }
              />
            </div>
            <AdminTextarea
              label="Excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Short summary shown on Journal cards and metadata."
              required
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <AdminInput
                label="Image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/journal-1.svg"
                required
              />
              <AdminInput
                label="Publish date"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required
              />
            </div>
            <AdminTextarea
              label="Content"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={14}
              placeholder="Write one paragraph, then leave a blank line before the next paragraph."
              required
            />
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-espresso">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#737963]"
                />
                Published
                <span className="font-normal text-espresso-muted">
                  (visible in Journal)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-espresso">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[#737963]"
                />
                Featured
                <span className="font-normal text-espresso-muted">
                  (shown first)
                </span>
              </label>
            </div>
          </div>
        </AdminCard>

        <AdminCard
          title="Image preview"
          subtitle="Use an existing public image path or a hosted image URL."
        >
          <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-ivory-dark">
            {image.trim() ? (
              <img
                src={image.trim()}
                alt={title || "Journal article preview"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-espresso-muted">
                <ImagePlus size={28} />
              </div>
            )}
          </div>
        </AdminCard>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => router.push("/admin/journal")}
              icon={<ArrowLeft size={15} />}
            >
              Back to Journal
            </AdminButton>
            {isEdit && (
              <AdminButton
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                icon={<Trash2 size={15} />}
              >
                Delete
              </AdminButton>
            )}
          </div>
          <AdminButton type="submit" size="lg" loading={saving}>
            {isEdit ? "Save changes" : "Create article"}
          </AdminButton>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete article"
        message="This permanently removes the article from the admin panel and public Journal."
        confirmLabel="Delete article"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
