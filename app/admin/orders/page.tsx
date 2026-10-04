"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatPKR, formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminInput } from "@/components/admin/AdminInput";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import type { OrderListItem } from "@/components/admin/types";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string, ps: string, q: string) => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (s) params.set("status", s);
        if (ps) params.set("paymentStatus", ps);
        if (q.trim()) params.set("search", q.trim());
        const d = await apiFetch<Paginated<OrderListItem>>(
          `/api/admin/orders?${params.toString()}`,
        );
        setItems(d.items);
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(page, status, paymentStatus, search);
  }, [load, page, status, paymentStatus, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const resetFilters = () => {
    setStatus("");
    setPaymentStatus("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Fulfilment pipeline — filter, inspect and update orders."
      />

      <AdminCard bodyClassName="px-0 py-0">
        <div className="grid gap-3 border-b border-espresso/10 px-5 py-4 md:grid-cols-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso-muted"
            />
            <AdminInput
              aria-label="Search orders"
              placeholder="Order #, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="[&>input]:pl-9"
            />
          </div>
          <AdminSelect
            aria-label="Filter by order status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            aria-label="Filter by payment status"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </AdminSelect>
          <div>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-md border border-espresso/15 px-3 py-2 text-sm font-semibold text-espresso-muted transition hover:border-espresso/40 hover:text-espresso md:w-auto"
            >
              Clear filters
            </button>
          </div>
        </div>

        {err ? (
          <ErrorState message={err} onRetry={() => void load(page, status, paymentStatus, search)} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : (
          <DataTable
            rowKey={(o) => o.id}
            rows={items}
            empty={<EmptyState title="No orders found" description="Try adjusting the filters." />}
            columns={[
              {
                key: "orderNumber",
                header: "Order",
                sortable: true,
                sortValue: (o) => o.orderNumber,
                render: (o) => (
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-espresso hover:text-olive"
                  >
                    {o.orderNumber}
                  </Link>
                ),
              },
              {
                key: "customer",
                header: "Customer",
                render: (o) => (
                  <div>
                    <p className="font-medium">{o.user?.name || "Guest"}</p>
                    {o.user?.email && (
                      <p className="text-xs text-espresso-muted">{o.user.email}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (o) => <StatusBadge status={o.status} tone="order" />,
              },
              {
                key: "payment",
                header: "Payment",
                render: (o) => <StatusBadge status={o.paymentStatus} tone="payment" />,
              },
              {
                key: "total",
                header: "Total",
                sortable: true,
                sortValue: (o) => o.total,
                className: "text-right",
                headerClassName: "text-right",
                render: (o) => (
                  <span className="font-semibold">{formatPKR(o.total)}</span>
                ),
              },
              {
                key: "date",
                header: "Placed",
                sortable: true,
                sortValue: (o) => o.createdAt,
                render: (o) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDateTime(o.createdAt)}
                  </span>
                ),
              },
              {
                key: "view",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (o) => (
                  <Link
                    href={`/admin/orders/${o.id}`}
                    aria-label={`View order ${o.orderNumber}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso"
                  >
                    <Eye size={16} />
                  </Link>
                ),
              },
            ]}
          />
        )}

        <div className="border-t border-espresso/10 px-5 py-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </AdminCard>
    </>
  );
}
