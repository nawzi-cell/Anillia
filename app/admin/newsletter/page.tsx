"use client";

import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { NewsletterSubscriber } from "@/components/admin/types";

export const dynamic = "force-dynamic";

function toCsv(rows: NewsletterSubscriber[]): string {
  const header = "email,active,subscribed_at";
  const lines = rows.map((r) =>
    [
      `"${r.email.replace(/"/g, '""')}"`,
      r.active ? "yes" : "no",
      new Date(r.createdAt).toISOString(),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export default function AdminNewsletterPage() {
  const { success, error } = useToast();
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<NewsletterSubscriber | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<NewsletterSubscriber[]>("/api/admin/newsletter");
      setSubs(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load subscribers.");
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
      await apiFetch(`/api/admin/newsletter/${deleting.id}`, { method: "DELETE" });
      success("Subscriber removed.");
      setSubs((prev) => prev.filter((x) => x.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to remove subscriber.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCsv = () => {
    if (subs.length === 0) {
      error("Nothing to export.");
      return;
    }
    const blob = new Blob([toCsv(subs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anilliea-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success(`Exported ${subs.length} subscriber(s).`);
  };

  const activeCount = subs.filter((s) => s.active).length;

  return (
    <>
      <PageHeader
        title="Newsletter"
        description={`${subs.length} total subscriber(s) · ${activeCount} active.`}
        actions={
          <AdminButton
            variant="secondary"
            icon={<Download size={15} />}
            onClick={exportCsv}
            disabled={subs.length === 0}
          >
            Export CSV
          </AdminButton>
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        {err ? (
          <ErrorState message={err} onRetry={() => void load()} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={8} cols={3} />
          </div>
        ) : (
          <DataTable
            rowKey={(s) => s.id}
            rows={subs}
            empty={<EmptyState title="No subscribers yet" />}
            columns={[
              {
                key: "email",
                header: "Email",
                sortable: true,
                sortValue: (s) => s.email,
                render: (s) => <span className="font-medium">{s.email}</span>,
              },
              {
                key: "active",
                header: "Status",
                render: (s) => (
                  <StatusBadge
                    status={s.active ? "Active" : "Unsubscribed"}
                    tone="bool"
                  />
                ),
              },
              {
                key: "date",
                header: "Subscribed",
                sortable: true,
                sortValue: (s) => s.createdAt,
                render: (s) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDateTime(s.createdAt)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (s) => (
                  <button
                    type="button"
                    aria-label={`Remove ${s.email}`}
                    onClick={() => setDeleting(s)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-red-800/10 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                ),
              },
            ]}
          />
        )}
      </AdminCard>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove subscriber"
        message={`Remove "${deleting?.email}" from the newsletter list?`}
        confirmLabel="Remove"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
