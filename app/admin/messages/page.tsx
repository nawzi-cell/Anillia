"use client";

import { useEffect, useState } from "react";
import { MailOpen, Trash2, Check } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";
import { AdminButton } from "@/components/admin/AdminButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { ContactMessage } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminMessagesPage() {
  const { success, error } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<ContactMessage[]>("/api/admin/messages");
      setMessages(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (m: ContactMessage, read: boolean) => {
    try {
      await apiFetch(`/api/admin/messages/${m.id}`, {
        method: "PUT",
        body: JSON.stringify({ read }),
      });
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, read } : x)),
      );
      setSelected((prev) => (prev?.id === m.id ? { ...prev, read } : prev));
      if (read) success("Marked as read.");
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update message.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/admin/messages/${deleting.id}`, { method: "DELETE" });
      success("Message deleted.");
      setMessages((prev) => prev.filter((x) => x.id !== deleting.id));
      if (selected?.id === deleting.id) setSelected(null);
      setDeleting(null);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to delete message.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          unreadCount > 0
            ? `${unreadCount} unread contact message${unreadCount > 1 ? "s" : ""}.`
            : "Contact-form messages from customers."
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        {err ? (
          <ErrorState message={err} onRetry={() => void load()} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={6} cols={4} />
          </div>
        ) : (
          <DataTable
            rowKey={(m) => m.id}
            rows={messages}
            empty={<EmptyState title="No messages" description="Your inbox is clear." />}
            onRowClick={(m) => {
              setSelected(m);
              if (!m.read) void markRead(m, true);
            }}
            columns={[
              {
                key: "from",
                header: "From",
                render: (m) => (
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-espresso/15" : "bg-olive"}`}
                      aria-label={m.read ? "Read" : "Unread"}
                    />
                    <div>
                      <p className={`text-sm ${m.read ? "" : "font-bold"} text-espresso`}>
                        {m.name}
                      </p>
                      <p className="text-xs text-espresso-muted">{m.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "subject",
                header: "Subject",
                render: (m) => (
                  <span className={m.read ? "text-espresso-muted" : "font-medium"}>
                    {m.subject || "—"}
                  </span>
                ),
              },
              {
                key: "excerpt",
                header: "Message",
                render: (m) => (
                  <span className="block max-w-sm truncate text-sm text-espresso-muted">
                    {m.message}
                  </span>
                ),
              },
              {
                key: "date",
                header: "Received",
                render: (m) => (
                  <span className="whitespace-nowrap text-espresso-muted">
                    {formatDateTime(m.createdAt)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </AdminCard>

      {/* Detail modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Message"
        wide
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-espresso/10 pb-4">
              <div>
                <p className="font-semibold text-espresso">{selected.name}</p>
                <a
                  href={`mailto:${selected.email}`}
                  className="text-sm text-olive hover:underline"
                >
                  {selected.email}
                </a>
                <p className="mt-1 text-xs text-espresso-muted">
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  selected.read
                    ? "bg-espresso/5 text-espresso-muted"
                    : "bg-olive/15 text-olive"
                }`}
              >
                {selected.read ? "Read" : "Unread"}
              </span>
            </div>
            {selected.subject && (
              <p className="font-serif text-lg font-semibold text-espresso">
                {selected.subject}
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-espresso">
              {selected.message}
            </p>
            <div className="flex flex-wrap justify-end gap-2 border-t border-espresso/10 pt-4">
              <AdminButton
                variant="secondary"
                icon={selected.read ? <MailOpen size={15} /> : <Check size={15} />}
                onClick={() => void markRead(selected, !selected.read)}
              >
                {selected.read ? "Mark unread" : "Mark read"}
              </AdminButton>
              <AdminButton
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => setDeleting(selected)}
              >
                Delete
              </AdminButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete message"
        message="Permanently delete this message?"
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
