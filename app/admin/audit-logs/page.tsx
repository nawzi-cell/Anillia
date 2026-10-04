"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminInput } from "@/components/admin/AdminInput";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import type { AuditLog } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<Paginated<AuditLog>>(
        `/api/admin/audit-logs?page=${p}`,
      );
      setItems(d.items);
      setPage(d.page);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  // Client-side filters applied to the currently fetched page
  const filtered = useMemo(() => {
    const a = actionFilter.trim().toLowerCase();
    const e = entityFilter.trim().toLowerCase();
    return items.filter(
      (log) =>
        (!a || log.action.toLowerCase().includes(a)) &&
        (!e || log.entity.toLowerCase().includes(e)),
    );
  }, [items, actionFilter, entityFilter]);

  const entities = useMemo(
    () => Array.from(new Set(items.map((l) => l.entity))).sort(),
    [items],
  );

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Who changed what, and when. Filters below apply to the current page."
      />

      <AdminCard bodyClassName="px-0 py-0">
        <div className="grid gap-3 border-b border-espresso/10 px-5 py-4 sm:grid-cols-3">
          <AdminInput
            aria-label="Filter by action"
            placeholder="Filter by action… e.g. UPDATE"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <AdminSelect
            aria-label="Filter by entity"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </AdminSelect>
          {(actionFilter || entityFilter) && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                }}
                className="w-full rounded-md border border-espresso/15 px-3 py-2 text-sm font-semibold text-espresso-muted transition hover:border-espresso/40 hover:text-espresso sm:w-auto"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {err ? (
          <ErrorState message={err} onRetry={() => void load(page)} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={10} cols={5} />
          </div>
        ) : (
          <DataTable
            rowKey={(l) => l.id}
            rows={filtered}
            defaultSortKey="date"
            defaultSortDir="desc"
            empty={<EmptyState title="No audit entries" />}
            columns={[
              {
                key: "date",
                header: "When",
                sortable: true,
                sortValue: (l) => l.createdAt,
                render: (l) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDateTime(l.createdAt)}
                  </span>
                ),
              },
              {
                key: "action",
                header: "Action",
                render: (l) => (
                  <span className="rounded bg-espresso/5 px-2 py-0.5 font-mono text-xs font-semibold">
                    {l.action}
                  </span>
                ),
              },
              {
                key: "entity",
                header: "Entity",
                render: (l) => (
                  <div>
                    <p className="font-medium">{l.entity}</p>
                    {l.entityId && (
                      <p className="font-mono text-xs text-espresso-muted">
                        {l.entityId}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "actor",
                header: "Actor",
                render: (l) => (
                  <div className="text-sm">
                    {l.user ? (
                      <>
                        <p className="font-medium">{l.user.name || "—"}</p>
                        <p className="text-xs text-espresso-muted">{l.user.email}</p>
                      </>
                    ) : (
                      <span className="text-espresso-muted">System</span>
                    )}
                    {l.ip && (
                      <p className="font-mono text-xs text-espresso-muted">{l.ip}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "details",
                header: "Details",
                render: (l) =>
                  l.metadata ? (
                    <details className="max-w-xs text-xs">
                      <summary className="cursor-pointer font-semibold text-olive">
                        View metadata
                      </summary>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-espresso/5 p-2 font-mono text-[11px] text-espresso">
                        {JSON.stringify(l.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-espresso-muted">—</span>
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
