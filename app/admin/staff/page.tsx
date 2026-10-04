"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { apiFetch, type Paginated } from "@/components/admin/admin-api";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { AdminInput } from "@/components/admin/AdminInput";
import { AdminButton } from "@/components/admin/AdminButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import type { StaffListItem } from "@/components/admin/types";

export const dynamic = "force-dynamic";

interface PendingChange {
  user: StaffListItem;
  toRole: "ADMIN" | "CUSTOMER";
}

export default function AdminStaffPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<StaffListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "CUSTOMER">(
    "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (p: number, q: string, role: string) => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (q.trim()) params.set("search", q.trim());
        if (role !== "ALL") params.set("role", role);
        const d = await apiFetch<Paginated<StaffListItem>>(
          `/api/admin/users?${params.toString()}`,
        );
        setItems(d.items);
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(page, search, roleFilter);
  }, [load, page, search, roleFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Who am I? Used to block self-demotion in the UI (the API enforces it too).
  useEffect(() => {
    apiFetch<{ id: string }>("/api/auth/me")
      .then((me) => setMeId(me.id))
      .catch(() => setMeId(null));
  }, []);

  const confirmChange = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${pending.user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: pending.toRole }),
      });
      success(
        pending.toRole === "ADMIN"
          ? `${pending.user.email} is now an admin.`
          : `${pending.user.email} is no longer an admin.`,
      );
      setPending(null);
      void load(page, search, roleFilter);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<StaffListItem>[] = [
    {
      key: "user",
      header: "User",
      render: (u: StaffListItem) => (
        <div>
          <p className="font-medium text-espresso">
            {u.name || "—"}
            {u.id === meId && (
              <span className="ml-2 rounded-full bg-espresso/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-espresso">
                You
              </span>
            )}
          </p>
          <p className="text-xs text-espresso-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u: StaffListItem) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
            u.role === "ADMIN"
              ? "bg-olive/15 text-olive"
              : "bg-espresso/5 text-espresso-muted"
          }`}
        >
          {u.role === "ADMIN" ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
          {u.role === "ADMIN" ? "Admin" : "Customer"}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      render: (u: StaffListItem) => (
        <span className="text-sm text-espresso">{u._count.orders}</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (u: StaffListItem) => (
        <span className="text-sm text-espresso-muted">
          {formatDate(u.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: StaffListItem) => {
        const isSelf = u.id === meId;
        const toRole = u.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
        return (
          <AdminButton
            variant="secondary"
            disabled={isSelf}
            title={
              isSelf
                ? "You cannot change your own role"
                : u.role === "ADMIN"
                  ? `Demote ${u.email} to customer`
                  : `Promote ${u.email} to admin`
            }
            onClick={() => setPending({ user: u, toRole })}
          >
            {u.role === "ADMIN" ? "Demote" : "Make admin"}
          </AdminButton>
        );
      },
    },
  ];

  const promoting = pending?.toRole === "ADMIN";
  const pendingEmail = pending?.user.email ?? "";

  return (
    <div>
      <PageHeader
        title="Staff & Access"
        description="Promote team members to admin or demote them back to customers. Every change is recorded in the audit log."
      />

      <AdminCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-espresso-muted"
            />
            <AdminInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="[&>input]:pl-9"
              aria-label="Search users"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "ADMIN", "CUSTOMER"] as const).map((r) => (
              <AdminButton
                key={r}
                variant={roleFilter === r ? "primary" : "secondary"}
                onClick={() => {
                  setPage(1);
                  setRoleFilter(r);
                }}
              >
                {r === "ALL" ? "Everyone" : r === "ADMIN" ? "Admins" : "Customers"}
              </AdminButton>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : err ? (
          <ErrorState message={err} onRetry={() => load(page, search, roleFilter)} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try a different search, or ask the person to register an account first."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              rowKey={(u) => u.id}
              empty={
                <EmptyState
                  title="No users found"
                  description="Try a different search, or ask the person to register an account first."
                />
              }
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-espresso-muted">
                {total} user{total === 1 ? "" : "s"} total
              </p>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </AdminCard>

      <ConfirmDialog
        open={pending !== null}
        title={promoting ? "Make this user an admin?" : "Remove admin access?"}
        message={
          promoting
            ? `${pendingEmail} will be able to manage products, orders, customers, coupons, and all other admin areas. Only do this for people you trust.`
            : `${pendingEmail} will lose access to the admin panel immediately and become a regular customer.`
        }
        confirmLabel={promoting ? "Make admin" : "Demote"}
        loading={saving}
        onConfirm={confirmChange}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
