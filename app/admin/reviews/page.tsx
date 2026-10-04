"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, EyeOff, Trash2, BadgeCheck } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { Review } from "@/components/admin/types";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "HIDDEN", label: "Hidden" },
  { key: "", label: "All" },
];

export default function AdminReviewsPage() {
  const { success, error } = useToast();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "PENDING";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (s) params.set("status", s);
      const d = await apiFetch<Review[]>(
        `/api/admin/reviews${params.toString() ? `?${params.toString()}` : ""}`,
      );
      setReviews(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  const setReviewStatus = async (r: Review, next: "APPROVED" | "HIDDEN") => {
    setActing(r.id);
    try {
      await apiFetch(`/api/admin/reviews/${r.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      success(
        next === "APPROVED" ? "Review approved." : "Review hidden from the store.",
      );
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update review.");
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/admin/reviews/${deleting.id}`, { method: "DELETE" });
      success("Review deleted.");
      setReviews((prev) => prev.filter((x) => x.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to delete review.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Moderate customer reviews before they appear on the storefront."
      />

      <AdminCard bodyClassName="px-0 py-0">
        <div className="flex gap-1 overflow-x-auto border-b border-espresso/10 px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.key || "all"}
              type="button"
              onClick={() => setStatus(t.key)}
              aria-pressed={status === t.key}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === t.key
                  ? "bg-espresso text-ivory"
                  : "text-espresso-muted hover:bg-espresso/5 hover:text-espresso"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {err ? (
          <ErrorState message={err} onRetry={() => void load(status)} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : (
          <DataTable
            rowKey={(r) => r.id}
            rows={reviews}
            empty={<EmptyState title="No reviews here" />}
            columns={[
              {
                key: "review",
                header: "Review",
                render: (r) => (
                  <div className="max-w-md">
                    <p className="font-medium text-espresso">
                      <span className="mr-2">
                        {"★".repeat(r.rating)}
                        <span className="text-taupe">{"★".repeat(5 - r.rating)}</span>
                      </span>
                      {r.title}
                    </p>
                    {r.comment && (
                      <p className="mt-1 line-clamp-2 text-sm text-espresso-muted">
                        {r.comment}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-espresso-muted">
                      {r.product.name} · {r.user.name || "Anonymous"}
                      {r.verifiedPurchase && (
                        <span className="ml-1.5 inline-flex items-center gap-1 font-semibold text-olive">
                          <BadgeCheck size={12} /> Verified purchase
                        </span>
                      )}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} tone="review" />,
              },
              {
                key: "date",
                header: "Submitted",
                render: (r) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDateTime(r.createdAt)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (r) => (
                  <div className="flex justify-end gap-1">
                    {r.status !== "APPROVED" && (
                      <button
                        type="button"
                        aria-label="Approve review"
                        title="Approve"
                        disabled={acting === r.id}
                        onClick={() => void setReviewStatus(r, "APPROVED")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-olive transition hover:bg-olive/10 disabled:opacity-40"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    {r.status !== "HIDDEN" && (
                      <button
                        type="button"
                        aria-label="Hide review"
                        title="Hide"
                        disabled={acting === r.id}
                        onClick={() => void setReviewStatus(r, "HIDDEN")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso disabled:opacity-40"
                      >
                        <EyeOff size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Delete review"
                      title="Delete"
                      onClick={() => setDeleting(r)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-red-800/10 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </AdminCard>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete review"
        message="Permanently delete this review? This cannot be undone."
        confirmLabel="Delete review"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
