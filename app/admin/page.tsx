"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  ShoppingBag,
  Users,
  Package,
  TriangleAlert,
} from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatPKR, formatDate, timeAgo } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { StatCard, StatCardSkeleton } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/Spinner";
import {
  LineChart,
  DonutChart,
  type DonutSegment,
} from "@/components/admin/SvgChart";
import type { DashboardData } from "@/components/admin/types";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "#D97706",
  CONFIRMED: "#0284C7",
  PROCESSING: "#4F46E5",
  SHIPPED: "#7C3AED",
  DELIVERED: "#059669",
  CANCELLED: "#B91C1C",
  RETURN_REQUESTED: "#EA580C",
  RETURNED: "#78716C",
};

function prettyStatus(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<DashboardData>("/api/admin/dashboard");
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Store performance at a glance." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AdminCard title="Revenue — last 14 days">
              <div className="h-56 animate-pulse rounded bg-espresso/5" />
            </AdminCard>
          </div>
          <AdminCard title="Orders by status">
            <div className="h-56 animate-pulse rounded bg-espresso/5" />
          </AdminCard>
        </div>
      </>
    );
  }

  if (err || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <AdminCard>
          <ErrorState message={err ?? "Failed to load dashboard."} onRetry={() => void load()} />
        </AdminCard>
      </>
    );
  }

  const { stats } = data;
  const revenuePoints = (data.revenueByDay ?? []).map((d) => ({
    label: formatDate(d.date, { day: "numeric", month: "short" }),
    value: d.revenue,
  }));
  const donutSegments: DonutSegment[] = (data.ordersByStatus ?? []).map((o) => ({
    label: prettyStatus(o.status),
    value: o.count,
    color: statusColors[o.status] ?? "#A69A89",
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Store performance at a glance."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-espresso/15 px-3 py-2 text-sm font-semibold text-espresso transition hover:border-espresso/40"
          >
            Refresh
          </button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total revenue"
          value={formatPKR(stats.revenue)}
          icon={<Banknote size={20} />}
        />
        <StatCard
          label="Orders"
          value={String(stats.orders)}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          label="Customers"
          value={String(stats.customers)}
          icon={<Users size={20} />}
        />
        <StatCard
          label="Products"
          value={String(stats.products)}
          icon={<Package size={20} />}
        />
        <StatCard
          label="Low stock alerts"
          value={String(stats.lowStockCount)}
          icon={<TriangleAlert size={20} />}
          accent={stats.lowStockCount > 0}
          hint={stats.lowStockCount > 0 ? "Needs attention" : "All stocked"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminCard
            title="Revenue — last 14 days"
            subtitle="Daily gross revenue in PKR."
          >
            <LineChart
              data={revenuePoints}
              valueFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
              }
            />
          </AdminCard>
        </div>
        <AdminCard title="Orders by status" subtitle="Lifetime distribution.">
          <DonutChart segments={donutSegments} />
        </AdminCard>
      </div>

      {/* Tables */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard
          title="Recent orders"
          actions={
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-olive hover:underline"
            >
              View all
            </Link>
          }
          bodyClassName="px-0 py-0"
        >
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <DataTable
              rowKey={(o) => o.id}
              rows={data.recentOrders}
              columns={[
                {
                  key: "order",
                  header: "Order",
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
                    <span className="text-espresso-muted">
                      {o.user?.name || o.user?.email || "Guest"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (o) => <StatusBadge status={o.status} tone="order" />,
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
                  key: "when",
                  header: "Placed",
                  render: (o) => (
                    <span className="whitespace-nowrap text-espresso-muted">
                      {timeAgo(o.createdAt)}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </AdminCard>

        <AdminCard
          title="Low stock"
          actions={
            <Link
              href="/admin/inventory?lowStock=true"
              className="text-sm font-semibold text-olive hover:underline"
            >
              Manage inventory
            </Link>
          }
          bodyClassName="px-0 py-0"
        >
          {data.lowStock.length === 0 ? (
            <EmptyState title="All stocked up" description="No items are below their low-stock threshold." />
          ) : (
            <DataTable
              rowKey={(i) => i.id}
              rows={data.lowStock}
              columns={[
                {
                  key: "product",
                  header: "Product",
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
                  key: "sku",
                  header: "SKU",
                  render: (i) => (
                    <span className="font-mono text-xs">{i.sku ?? "—"}</span>
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
                    <span className="font-semibold text-red-800">{i.available}</span>
                  ),
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
              ]}
            />
          )}
        </AdminCard>

        <AdminCard
          title="Recent customers"
          actions={
            <Link
              href="/admin/customers"
              className="text-sm font-semibold text-olive hover:underline"
            >
              View all
            </Link>
          }
          bodyClassName="px-0 py-0"
        >
          {data.recentCustomers.length === 0 ? (
            <EmptyState title="No customers yet" />
          ) : (
            <DataTable
              rowKey={(c) => c.id}
              rows={data.recentCustomers}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (c) => (
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-semibold text-espresso hover:text-olive"
                    >
                      {c.name || "Unnamed"}
                    </Link>
                  ),
                },
                {
                  key: "email",
                  header: "Email",
                  render: (c) => (
                    <span className="text-espresso-muted">{c.email ?? "—"}</span>
                  ),
                },
                {
                  key: "joined",
                  header: "Joined",
                  render: (c) => (
                    <span className="whitespace-nowrap text-espresso-muted">
                      {timeAgo(c.createdAt)}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </AdminCard>

        <AdminCard
          title="Pending reviews"
          actions={
            <Link
              href="/admin/reviews?status=PENDING"
              className="text-sm font-semibold text-olive hover:underline"
            >
              Moderate
            </Link>
          }
          bodyClassName="px-0 py-0"
        >
          {data.recentReviews.length === 0 ? (
            <EmptyState title="No pending reviews" description="All reviews have been moderated." />
          ) : (
            <DataTable
              rowKey={(r) => r.id}
              rows={data.recentReviews}
              columns={[
                {
                  key: "title",
                  header: "Review",
                  render: (r) => (
                    <div>
                      <p className="font-medium">
                        {"★".repeat(r.rating)}
                        <span className="text-taupe">{"★".repeat(5 - r.rating)}</span>
                        {r.title && <span className="ml-2">{r.title}</span>}
                      </p>
                      <p className="text-xs text-espresso-muted">
                        {r.product.name} · {r.user.name || "Anonymous"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} tone="review" />,
                },
              ]}
            />
          )}
        </AdminCard>
      </div>
    </>
  );
}
