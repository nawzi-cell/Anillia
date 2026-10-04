"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminInput } from "@/components/admin/AdminInput";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { JournalArticleListItem } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminJournalPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<JournalArticleListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q.trim()) params.set("search", q.trim());
      const d = await apiFetch<Paginated<JournalArticleListItem>>(
        `/api/admin/journal?${params.toString()}`,
      );
      setItems(d.items);
      setPage(d.page);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load articles.");
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

  const toggleField = async (
    article: JournalArticleListItem,
    field: "published" | "featured",
  ) => {
    setToggling(`${article.id}:${field}`);
    try {
      await apiFetch(`/api/admin/journal/${article.id}`, {
        method: "PUT",
        body: JSON.stringify({ [field]: !article[field] }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === article.id ? { ...item, [field]: !item[field] } : item,
        ),
      );
      success(
        field === "published"
          ? article.published
            ? "Article unpublished."
            : "Article published."
          : article.featured
            ? "Article removed from featured."
            : "Article marked as featured.",
      );
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update article.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Journal"
        description="Create and manage styling notes, guides, and editorial articles."
        actions={
          <Link href="/admin/journal/new">
            <AdminButton icon={<Plus size={16} />}>New article</AdminButton>
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
              aria-label="Search articles"
              placeholder="Search title, slug, excerpt..."
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
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : (
          <DataTable
            rowKey={(article) => article.id}
            rows={items}
            empty={
              <EmptyState
                title="No articles found"
                description={
                  search
                    ? "Try a different search term."
                    : "Create your first Journal article."
                }
                action={
                  !search ? (
                    <Link href="/admin/journal/new">
                      <AdminButton icon={<Plus size={16} />}>New article</AdminButton>
                    </Link>
                  ) : undefined
                }
              />
            }
            columns={[
              {
                key: "article",
                header: "Article",
                sortable: true,
                sortValue: (article) => article.title,
                render: (article) => (
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-ivory-dark">
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div>
                      <Link
                        href={`/admin/journal/${article.id}`}
                        className="font-semibold text-espresso hover:text-olive"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-espresso-muted">/{article.slug}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "publishedAt",
                header: "Date",
                sortable: true,
                sortValue: (article) => article.publishedAt,
                render: (article) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDate(article.publishedAt)}
                  </span>
                ),
              },
              {
                key: "published",
                header: "Published",
                render: (article) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={article.published}
                    aria-label={`Toggle published for ${article.title}`}
                    disabled={toggling === `${article.id}:published`}
                    onClick={() => void toggleField(article, "published")}
                    className={`relative h-6 w-11 rounded-full transition ${
                      article.published ? "bg-olive" : "bg-espresso/20"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        article.published ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                ),
              },
              {
                key: "featured",
                header: "Featured",
                render: (article) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={article.featured}
                    aria-label={`Toggle featured for ${article.title}`}
                    disabled={toggling === `${article.id}:featured`}
                    onClick={() => void toggleField(article, "featured")}
                    className={`relative h-6 w-11 rounded-full transition ${
                      article.featured ? "bg-espresso" : "bg-espresso/20"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        article.featured ? "left-[22px]" : "left-0.5"
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
                render: (article) => (
                  <Link
                    href={`/admin/journal/${article.id}`}
                    aria-label={`Edit ${article.title}`}
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
