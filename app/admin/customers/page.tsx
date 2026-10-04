"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminInput } from "@/components/admin/AdminInput";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import type { CustomerListItem } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminCustomersPage() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set("search", q.trim());
      const d = await apiFetch<Paginated<CustomerListItem>>(
        `/api/admin/customers?${params.toString()}`,
      );
      setItems(d.items);
      setPage(d.page);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, search);
  }, [load, page, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Registered shoppers and their order history."
      />

      <AdminCard bodyClassName="px-0 py-0">
        <div className="border-b border-espresso/10 px-5 py-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso-muted"
            />
            <AdminInput
              aria-label="Search customers"
              placeholder="Search name, email, phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="[&>input]:pl-9"
            />
          </div>
        </div>

        {err ? (
          <ErrorState message={err} onRetry={() => void load(page, search)} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : (
          <DataTable
            rowKey={(c) => c.id}
            rows={items}
            empty={<EmptyState title="No customers found" />}
            columns={[
              {
                key: "name",
                header: "Customer",
                sortable: true,
                sortValue: (c) => c.name ?? "",
                render: (c) => (
                  <div>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-semibold text-espresso hover:text-olive"
                    >
                      {c.name || "Unnamed"}
                    </Link>
                    {c.email && (
                      <p className="text-xs text-espresso-muted">{c.email}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "phone",
                header: "Phone",
                render: (c) => (
                  <span className="text-espresso-muted">{c.phone ?? "—"}</span>
                ),
              },
              {
                key: "orders",
                header: "Orders",
                sortable: true,
                sortValue: (c) => c._count.orders,
                className: "text-right",
                headerClassName: "text-right",
                render: (c) => (
                  <span className="font-semibold">{c._count.orders}</span>
                ),
              },
              {
                key: "joined",
                header: "Joined",
                sortable: true,
                sortValue: (c) => c.createdAt,
                render: (c) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDate(c.createdAt)}
                  </span>
                ),
              },
              {
                key: "view",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (c) => (
                  <Link
                    href={`/admin/customers/${c.id}`}
                    aria-label={`View ${c.name || c.email || "customer"}`}
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
