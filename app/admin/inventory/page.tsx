"use client";

import { useCallback, useEffect, useState } from "react";
import { TriangleAlert, Save } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminButton } from "@/components/admin/AdminButton";
import { Pagination } from "@/components/admin/Pagination";
import { useToast } from "@/components/admin/Toast";
import type { InventoryItem } from "@/components/admin/types";

export const dynamic = "force-dynamic";

interface InventoryPage extends Paginated<InventoryItem> {
  lowStockCount: number;
}

export default function AdminInventoryPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lowCount, setLowCount] = useState(0);
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, lowOnly: boolean, silent = false) => {
      if (!silent) setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (lowOnly) params.set("lowStock", "true");
        const d = await apiFetch<InventoryPage>(
          `/api/admin/inventory?${params.toString()}`,
        );
        setItems(d.items);
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
        setLowCount(d.lowStockCount);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load inventory.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(page, lowStockOnly);
  }, [load, page, lowStockOnly]);

  const saveQuantity = async (item: InventoryItem) => {
    const raw = editingQty[item.id];
    const qty = Number(raw);
    if (raw === undefined || raw.trim() === "" || Number.isNaN(qty) || qty < 0) {
      error("Enter a valid non-negative quantity.");
      return;
    }
    setSavingId(item.id);
    try {
      await apiFetch<InventoryItem>(
        `/api/admin/inventory/${item.id}`,
        { method: "PUT", body: JSON.stringify({ quantity: qty }) },
      );
      setEditingQty((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      success(`Stock for ${item.sku ?? item.product.name} updated to ${qty}.`);
      await load(page, lowStockOnly, true);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update stock.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels per SKU. Adjust quantities directly — reserved units are held by open orders."
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-espresso/15 px-3 py-2 text-sm font-semibold text-espresso transition hover:border-espresso/40">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-[#737963]"
            />
            Low stock only
            {lowCount > 0 && (
              <span className="rounded-full bg-red-800/10 px-2 py-0.5 text-xs font-bold text-red-800">
                {lowCount}
              </span>
            )}
          </label>
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        {err ? (
          <ErrorState message={err} onRetry={() => void load(page, lowStockOnly)} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={10} cols={7} />
          </div>
        ) : (
          <DataTable
            rowKey={(i) => i.id}
            rows={items}
            defaultSortKey="product"
            empty={
              <EmptyState
                title={lowStockOnly ? "No low-stock items" : "No inventory records"}
                description={
                  lowStockOnly
                    ? "Nothing is below its low-stock threshold."
                    : undefined
                }
              />
            }
            columns={[
              {
                key: "sku",
                header: "SKU",
                sortable: true,
                sortValue: (i) => i.sku ?? "",
                render: (i) => (
                  <span className="font-mono text-xs">{i.sku ?? "—"}</span>
                ),
              },
              {
                key: "product",
                header: "Product",
                sortable: true,
                sortValue: (i) => `${i.product.name} ${i.variant?.name ?? ""}`,
                render: (i) => (
                  <div>
                    <p className="font-medium">{i.product.name}</p>
                    {i.variant?.name && (
                      <p className="text-xs text-espresso-muted">{i.variant.name}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "available",
                header: "Available",
                sortable: true,
                sortValue: (i) => i.available,
                className: "text-right",
                headerClassName: "text-right",
                render: (i) => (
                  <span
                    className={`font-semibold ${i.isLow ? "text-red-800" : ""}`}
                  >
                    {i.available}
                  </span>
                ),
              },
              {
                key: "reserved",
                header: "Reserved",
                sortable: true,
                sortValue: (i) => i.reserved,
                className: "text-right",
                headerClassName: "text-right",
                render: (i) => (
                  <span className="text-espresso-muted">{i.reserved}</span>
                ),
              },
              {
                key: "onHand",
                header: "On hand",
                sortable: true,
                sortValue: (i) => i.quantity,
                className: "text-right",
                headerClassName: "text-right",
                render: (i) => <span>{i.quantity}</span>,
              },
              {
                key: "threshold",
                header: "Threshold",
                className: "text-right",
                headerClassName: "text-right",
                render: (i) => (
                  <span className="text-espresso-muted">{i.lowStockThreshold}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (i) =>
                  i.isLow ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-900">
                      <TriangleAlert size={12} /> Low stock
                    </span>
                  ) : (
                    <StatusBadge status="OK" tone="order" />
                  ),
              },
              {
                key: "adjust",
                header: "Adjust quantity",
                className: "text-right",
                headerClassName: "text-right",
                render: (i) => (
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`New quantity for ${i.sku ?? i.product.name}`}
                      value={editingQty[i.id] ?? String(i.quantity)}
                      onChange={(e) =>
                        setEditingQty((prev) => ({
                          ...prev,
                          [i.id]: e.target.value,
                        }))
                      }
                      className="w-20 rounded-md border border-espresso/15 bg-ivory px-2 py-1.5 text-right text-sm focus:border-olive focus:outline-none"
                    />
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      icon={<Save size={14} />}
                      loading={savingId === i.id}
                      disabled={
                        savingId === i.id ||
                        (editingQty[i.id] ?? String(i.quantity)) ===
                          String(i.quantity)
                      }
                      onClick={() => void saveQuantity(i)}
                    >
                      Save
                    </AdminButton>
                  </div>
                ),
              },
            ]}
          />
        )}
        {!err && !loading && total > 0 && (
          <div className="border-t border-espresso/10 px-5 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </AdminCard>
    </>
  );
}
