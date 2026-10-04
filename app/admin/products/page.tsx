"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatPKR } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminInput } from "@/components/admin/AdminInput";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { ProductListItem } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (q.trim()) params.set("search", q.trim());
        const d = await apiFetch<Paginated<ProductListItem>>(
          `/api/admin/products?${params.toString()}`,
        );
        setItems(d.items);
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(page, search);
  }, [load, page, search]);

  // Debounced search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const toggleField = async (
    product: ProductListItem,
    field: "published" | "featured",
  ) => {
    setToggling(`${product.id}:${field}`);
    try {
      await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ [field]: !product[field] }),
      });
      setItems((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, [field]: !p[field] } : p,
        ),
      );
      success(
        `${product.name} ${field === "published" ? (product.published ? "unpublished" : "published") : product.featured ? "removed from featured" : "marked as featured"}.`,
      );
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update product.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue including unpublished products."
        actions={
          <Link href="/admin/products/new">
            <AdminButton icon={<Plus size={16} />}>New product</AdminButton>
          </Link>
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        <div className="border-b border-espresso/10 px-5 py-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso-muted"
            />
            <AdminInput
              aria-label="Search products"
              placeholder="Search name, SKU…"
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
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : (
          <DataTable
            rowKey={(p) => p.id}
            rows={items}
            empty={
              <EmptyState
                title="No products found"
                description={
                  search
                    ? "Try a different search term."
                    : "Create your first product to get started."
                }
                action={
                  !search ? (
                    <Link href="/admin/products/new">
                      <AdminButton icon={<Plus size={16} />}>
                        New product
                      </AdminButton>
                    </Link>
                  ) : undefined
                }
              />
            }
            columns={[
              {
                key: "thumb",
                header: "",
                render: (p) => (
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-ivory-dark">
                    {p.images[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-taupe">
                        No img
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "name",
                header: "Product",
                sortable: true,
                sortValue: (p) => p.name,
                render: (p) => (
                  <div>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-semibold text-espresso hover:text-olive"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-espresso-muted">
                      {p.category?.name ?? "Uncategorized"}
                      {p.variants.length > 0 &&
                        ` · ${p.variants.length} variant${p.variants.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                ),
              },
              {
                key: "sku",
                header: "SKU",
                render: (p) => (
                  <span className="font-mono text-xs">{p.sku ?? "—"}</span>
                ),
              },
              {
                key: "price",
                header: "Price",
                sortable: true,
                sortValue: (p) => p.price,
                className: "text-right",
                headerClassName: "text-right",
                render: (p) => (
                  <div className="text-right">
                    <p className="font-semibold">{formatPKR(p.price)}</p>
                    {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                      <p className="text-xs text-espresso-muted line-through">
                        {formatPKR(p.compareAtPrice)}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "stock",
                header: "Stock",
                sortable: true,
                sortValue: (p) => p.stock,
                className: "text-right",
                headerClassName: "text-right",
                render: (p) => (
                  <span className={p.stock <= 0 ? "font-semibold text-red-800" : ""}>
                    {p.stock}
                  </span>
                ),
              },
              {
                key: "published",
                header: "Published",
                render: (p) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.published}
                    aria-label={`Toggle published for ${p.name}`}
                    disabled={toggling === `${p.id}:published`}
                    onClick={() => void toggleField(p, "published")}
                    className={`relative h-6 w-11 rounded-full transition ${
                      p.published ? "bg-olive" : "bg-espresso/20"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        p.published ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                ),
              },
              {
                key: "featured",
                header: "Featured",
                render: (p) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.featured}
                    aria-label={`Toggle featured for ${p.name}`}
                    disabled={toggling === `${p.id}:featured`}
                    onClick={() => void toggleField(p, "featured")}
                    className={`relative h-6 w-11 rounded-full transition ${
                      p.featured ? "bg-espresso" : "bg-espresso/20"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        p.featured ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                ),
              },
              {
                key: "edit",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (p) => (
                  <Link
                    href={`/admin/products/${p.id}`}
                    aria-label={`Edit ${p.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso"
                  >
                    <Pencil size={16} />
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
