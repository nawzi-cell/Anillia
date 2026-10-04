"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatPKR, formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CouponModal } from "@/components/admin/CouponModal";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { Coupon } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminCouponsPage() {
  const { success, error } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<Coupon[]>("/api/admin/coupons");
      setCoupons(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/admin/coupons/${deleting.id}`, { method: "DELETE" });
      success(`Coupon ${deleting.code} deleted.`);
      setDeleting(null);
      void load();
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to delete coupon.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const valueLabel = (c: Coupon) =>
    c.type === "PERCENTAGE" ? `${c.value}%` : formatPKR(c.value);

  const isExpired = (c: Coupon) =>
    c.expiryDate != null && new Date(c.expiryDate).getTime() < Date.now();

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers apply at checkout."
        actions={
          <AdminButton
            icon={<Plus size={16} />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New coupon
          </AdminButton>
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        {err ? (
          <ErrorState message={err} onRetry={() => void load()} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : (
          <DataTable
            rowKey={(c) => c.id}
            rows={coupons}
            empty={
              <EmptyState
                title="No coupons yet"
                description="Create a discount code to reward your customers."
                action={
                  <AdminButton
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  >
                    New coupon
                  </AdminButton>
                }
              />
            }
            columns={[
              {
                key: "code",
                header: "Code",
                sortable: true,
                sortValue: (c) => c.code,
                render: (c) => (
                  <span className="rounded bg-espresso/5 px-2 py-1 font-mono text-sm font-bold tracking-wide">
                    {c.code}
                  </span>
                ),
              },
              {
                key: "value",
                header: "Discount",
                sortable: true,
                sortValue: (c) => c.value,
                render: (c) => (
                  <div>
                    <p className="font-semibold">{valueLabel(c)}</p>
                    {c.type === "PERCENTAGE" && c.maximumDiscount != null && (
                      <p className="text-xs text-espresso-muted">
                        max {formatPKR(c.maximumDiscount)}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "min",
                header: "Min order",
                className: "text-right",
                headerClassName: "text-right",
                render: (c) => (
                  <span className="text-espresso-muted">
                    {c.minimumOrderAmount != null
                      ? formatPKR(c.minimumOrderAmount)
                      : "—"}
                  </span>
                ),
              },
              {
                key: "usage",
                header: "Usage",
                sortable: true,
                sortValue: (c) => c.usedCount,
                className: "text-right",
                headerClassName: "text-right",
                render: (c) => (
                  <span>
                    {c.usedCount}
                    {c.usageLimit != null && (
                      <span className="text-espresso-muted"> / {c.usageLimit}</span>
                    )}
                  </span>
                ),
              },
              {
                key: "dates",
                header: "Valid",
                render: (c) => (
                  <div className="text-xs text-espresso-muted">
                    <p>{formatDate(c.startDate)} →</p>
                    <p>{c.expiryDate ? formatDate(c.expiryDate) : "No expiry"}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (c) => (
                  <div className="flex flex-col gap-1">
                    <StatusBadge
                      status={c.active ? "Active" : "Inactive"}
                      tone="bool"
                    />
                    {isExpired(c) && (
                      <span className="text-xs font-semibold text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (c) => (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit coupon ${c.code}`}
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete coupon ${c.code}`}
                      onClick={() => setDeleting(c)}
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

      <CouponModal
        open={modalOpen}
        coupon={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete coupon"
        message={`Delete coupon "${deleting?.code}"? Existing orders that used it keep their discount; the code just stops working for new orders.`}
        confirmLabel="Delete coupon"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
