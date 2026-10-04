"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Mail, Phone, CalendarDays } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatPKR, formatDate, formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { LoadingState, ErrorState } from "@/components/admin/Spinner";
import { EmptyState } from "@/components/admin/EmptyState";
import type { CustomerFull } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [customer, setCustomer] = useState<CustomerFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await apiFetch<CustomerFull>(`/api/admin/customers/${params.id}`);
      setCustomer(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load customer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <AdminCard>
        <LoadingState label="Loading customer…" />
      </AdminCard>
    );
  }

  if (err || !customer) {
    return (
      <>
        <PageHeader title="Customer" />
        <AdminCard>
          <ErrorState message={err ?? "Customer not found."} onRetry={() => void load()} />
        </AdminCard>
      </>
    );
  }

  const lifetimeValue = (customer.orders ?? []).reduce(
    (sum, o) => sum + Number(o.total || 0),
    0,
  );

  return (
    <>
      <PageHeader
        title={customer.name || "Unnamed customer"}
        description={customer.email ?? undefined}
        actions={
          <Link href="/admin/customers">
            <AdminButton variant="secondary" icon={<ArrowLeft size={15} />}>
              Back to customers
            </AdminButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          {/* Profile */}
          <AdminCard title="Profile">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-olive/15 font-serif text-2xl font-semibold text-olive">
              {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
            </div>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-espresso-muted" />
                <span>{customer.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-espresso-muted" />
                <span>{customer.phone ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CalendarDays size={15} className="shrink-0 text-espresso-muted" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-espresso/10 pt-4">
              <div>
                <p className="eyebrow">Orders</p>
                <p className="mt-1 font-serif text-2xl font-semibold">
                  {customer.orders.length}
                </p>
              </div>
              <div>
                <p className="eyebrow">Lifetime value</p>
                <p className="mt-1 font-serif text-2xl font-semibold">
                  {formatPKR(lifetimeValue)}
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Addresses */}
          <AdminCard title="Addresses">
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-espresso-muted">
                No saved addresses yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {customer.addresses.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-olive" />
                    <div className="text-sm leading-relaxed">
                      {a.label && (
                        <p className="text-xs font-bold uppercase tracking-wider text-espresso-muted">
                          {a.label}
                        </p>
                      )}
                      {a.name && <p className="font-semibold">{a.name}</p>}
                      {a.address && <p>{a.address}</p>}
                      {(a.city || a.postalCode) && (
                        <p>
                          {[a.city, a.postalCode].filter(Boolean).join(" ")}
                        </p>
                      )}
                      {a.country && <p>{a.country}</p>}
                      {a.phone && (
                        <p className="text-espresso-muted">{a.phone}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        {/* Order history */}
        <div className="lg:col-span-2">
          <AdminCard
            title="Order history"
            subtitle={`${customer.orders.length} order(s)`}
            bodyClassName="px-0 py-0"
          >
            {customer.orders.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <DataTable
                rowKey={(o) => o.id}
                rows={customer.orders}
                defaultSortKey="date"
                defaultSortDir="desc"
                columns={[
                  {
                    key: "orderNumber",
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
                    key: "status",
                    header: "Status",
                    render: (o) => <StatusBadge status={o.status} tone="order" />,
                  },
                  {
                    key: "payment",
                    header: "Payment",
                    render: (o) => (
                      <StatusBadge status={o.paymentStatus} tone="payment" />
                    ),
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
                ]}
              />
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
