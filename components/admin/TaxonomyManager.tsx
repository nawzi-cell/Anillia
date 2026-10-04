"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "./admin-api";
import { slugify } from "./format";
import { useToast } from "./Toast";
import { PageHeader } from "./PageHeader";
import { AdminCard } from "./AdminCard";
import { DataTable } from "./DataTable";
import { AdminButton } from "./AdminButton";
import { AdminInput } from "./AdminInput";
import { AdminTextarea } from "./AdminTextarea";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { ErrorState, TableSkeleton } from "./Spinner";

export interface TaxonomyRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
}

interface TaxonomyManagerProps {
  endpoint: string;
  title: string;
  description: string;
  singular: string;
}

export function TaxonomyManager({
  endpoint,
  title,
  description,
  singular,
}: TaxonomyManagerProps) {
  const { success, error } = useToast();
  const [records, setRecords] = useState<TaxonomyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxonomyRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const [deleting, setDeleting] = useState<TaxonomyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<TaxonomyRecord[]>(endpoint);
      setRecords(Array.isArray(d) ? d : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : `Failed to load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDesc("");
    setImage("");
    setActive(true);
    setSortOrder("0");
    setModalOpen(true);
  };

  const openEdit = (r: TaxonomyRecord) => {
    setEditing(r);
    setName(r.name ?? "");
    setSlug(r.slug ?? "");
    setSlugTouched(true);
    setDesc(r.description ?? "");
    setImage(r.image ?? "");
    setActive(r.active !== false);
    setSortOrder(String(r.sortOrder ?? 0));
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: desc.trim() || null,
        image: image.trim() || null,
        active,
        sortOrder: Number(sortOrder) || 0,
      };
      if (editing) {
        await apiFetch(`${endpoint}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        success(`${singular} updated.`);
      } else {
        await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        success(`${singular} created.`);
      }
      setModalOpen(false);
      void load();
    } catch (e2) {
      error(e2 instanceof Error ? e2.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`${endpoint}/${deleting.id}`, { method: "DELETE" });
      success(`${singular} deleted.`);
      setDeleting(null);
      void load();
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <AdminButton icon={<Plus size={16} />} onClick={openCreate}>
            New {singular.toLowerCase()}
          </AdminButton>
        }
      />

      <AdminCard bodyClassName="px-0 py-0">
        {err ? (
          <ErrorState message={err} onRetry={() => void load()} />
        ) : loading ? (
          <div className="px-5 py-4">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : (
          <DataTable
            rowKey={(r) => r.id}
            rows={records}
            defaultSortKey="sortOrder"
            empty={
              <EmptyState
                title={`No ${title.toLowerCase()} yet`}
                action={
                  <AdminButton icon={<Plus size={16} />} onClick={openCreate}>
                    New {singular.toLowerCase()}
                  </AdminButton>
                }
              />
            }
            columns={[
              {
                key: "image",
                header: "",
                render: (r) => (
                  <div className="relative h-11 w-11 overflow-hidden rounded-md bg-ivory-dark">
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.name}
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
                header: "Name",
                sortable: true,
                sortValue: (r) => r.name,
                render: (r) => (
                  <div>
                    <p className="font-semibold text-espresso">{r.name}</p>
                    <p className="font-mono text-xs text-espresso-muted">
                      /{r.slug}
                    </p>
                  </div>
                ),
              },
              {
                key: "description",
                header: "Description",
                render: (r) => (
                  <span className="block max-w-xs truncate text-espresso-muted">
                    {r.description || "—"}
                  </span>
                ),
              },
              {
                key: "sortOrder",
                header: "Order",
                sortable: true,
                sortValue: (r) => r.sortOrder ?? 0,
                className: "text-right",
                headerClassName: "text-right",
                render: (r) => (
                  <span className="text-espresso-muted">{r.sortOrder ?? 0}</span>
                ),
              },
              {
                key: "active",
                header: "Status",
                render: (r) => (
                  <StatusBadge
                    status={r.active === false ? "Inactive" : "Active"}
                    tone="bool"
                  />
                ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                headerClassName: "text-right",
                render: (r) => (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${r.name}`}
                      onClick={() => openEdit(r)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-espresso-muted transition hover:bg-espresso/5 hover:text-espresso"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${r.name}`}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
            <AdminInput
              label="Slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              hint="URL-safe identifier."
            />
          </div>
          <AdminTextarea
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
          <AdminInput
            label="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="/images/categories/….svg"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              label="Sort order"
              type="number"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <label className="flex cursor-pointer items-end gap-2.5 pb-2 text-sm font-medium text-espresso">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-[#737963]"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-espresso/10 pt-4">
            <AdminButton variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={saving}>
              {editing ? "Save changes" : `Create ${singular.toLowerCase()}`}
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${singular.toLowerCase()}`}
        message={`Delete "${deleting?.name}"? Products linked to it may be affected — the server will refuse if the record is still referenced.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
