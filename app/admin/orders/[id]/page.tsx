"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, MapPin, CreditCard } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { formatPKR, formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { LoadingState, ErrorState } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/components/admin/order-status";
import type { OrderFull } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { success, error } = useToast();
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const o = await apiFetch<OrderFull>(`/api/admin/orders/${params.id}`);
      setOrder(o);
      setStatus(o.status);
      setPaymentStatus(o.payment?.status ?? o.paymentStatus);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleUpdate = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await apiFetch<OrderFull>(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({ status, paymentStatus }),
      });
      setOrder(updated);
      setStatus(updated.status);
      setPaymentStatus(updated.payment?.status ?? updated.paymentStatus);
      success("Order updated.");
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminCard>
        <LoadingState label="Loading order…" />
      </AdminCard>
    );
  }

  if (err || !order) {
    return (
      <>
        <PageHeader title="Order" />
        <AdminCard>
          <ErrorState message={err ?? "Order not found."} onRetry={() => void load()} />
        </AdminCard>
      </>
    );
  }

  const shippingLines = [
    order.shippingName,
    order.shippingAddress,
    [order.shippingCity, order.shippingPostalCode].filter(Boolean).join(" "),
    order.shippingCountry,
  ].filter(Boolean);

  const dirty =
    status !== order.status ||
    paymentStatus !== (order.payment?.status ?? order.paymentStatus);

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <Link href="/admin/orders">
            <AdminButton variant="secondary" icon={<ArrowLeft size={15} />}>
              Back to orders
            </AdminButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Items */}
          <AdminCard
            title="Items"
            actions={<StatusBadge status={order.status} tone="order" />}
            bodyClassName="px-0 py-0"
          >
            <DataTable
              rowKey={(_, i) => `item-${i}`}
              rows={order.items ?? []}
              columns={[
                {
                  key: "product",
                  header: "Product",
                  render: (it) => (
                    <div>
                      <p className="font-medium">{it.productName}</p>
                      {it.variantName && (
                        <p className="text-xs text-espresso-muted">{it.variantName}</p>
                      )}
                      {it.sku && (
                        <p className="font-mono text-xs text-espresso-muted">{it.sku}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "price",
                  header: "Price",
                  className: "text-right",
                  headerClassName: "text-right",
                  render: (it) => <span>{formatPKR(it.price)}</span>,
                },
                {
                  key: "qty",
                  header: "Qty",
                  className: "text-right",
                  headerClassName: "text-right",
                  render: (it) => <span>{it.quantity}</span>,
                },
                {
                  key: "subtotal",
                  header: "Subtotal",
                  className: "text-right",
                  headerClassName: "text-right",
                  render: (it) => (
                    <span className="font-semibold">{formatPKR(it.subtotal)}</span>
                  ),
                },
              ]}
            />
            <div className="border-t border-espresso/10 px-5 py-4">
              <dl className="ml-auto flex max-w-xs flex-col gap-1.5 text-sm">
                {order.subtotal != null && (
                  <div className="flex justify-between text-espresso-muted">
                    <dt>Subtotal</dt>
                    <dd>{formatPKR(order.subtotal)}</dd>
                  </div>
                )}
                {order.shippingCost != null && (
                  <div className="flex justify-between text-espresso-muted">
                    <dt>Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</dt>
                    <dd>{formatPKR(order.shippingCost)}</dd>
                  </div>
                )}
                {order.discount != null && order.discount > 0 && (
                  <div className="flex justify-between text-olive">
                    <dt>
                      Discount
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </dt>
                    <dd>−{formatPKR(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-espresso/10 pt-2 text-base font-semibold text-espresso">
                  <dt>Total</dt>
                  <dd>{formatPKR(order.total)}</dd>
                </div>
              </dl>
            </div>
          </AdminCard>

          {/* Shipping */}
          <AdminCard title="Shipping">
            {shippingLines.length === 0 && !order.shippingPhone ? (
              <p className="text-sm text-espresso-muted">No shipping details recorded.</p>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-olive" />
                <div className="text-sm leading-relaxed">
                  {shippingLines.map((line, i) => (
                    <p key={i} className={i === 0 ? "font-semibold" : ""}>
                      {line}
                    </p>
                  ))}
                  {order.shippingPhone && (
                    <p className="text-espresso-muted">{order.shippingPhone}</p>
                  )}
                </div>
              </div>
            )}
          </AdminCard>

          {order.notes && (
            <AdminCard title="Order notes">
              <p className="text-sm leading-relaxed text-espresso">{order.notes}</p>
            </AdminCard>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Status management */}
          <AdminCard title="Update status">
            <div className="flex flex-col gap-4">
              <AdminSelect
                label="Order status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                label="Payment status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </AdminSelect>
              <AdminButton
                onClick={() => void handleUpdate()}
                loading={saving}
                disabled={!dirty}
              >
                Update order
              </AdminButton>
              {!dirty && (
                <p className="text-xs text-espresso-muted">
                  No changes yet — adjust a status above to update.
                </p>
              )}
            </div>
          </AdminCard>

          {/* Customer */}
          <AdminCard title="Customer">
            <div className="flex items-start gap-3">
              <User size={18} className="mt-0.5 shrink-0 text-olive" />
              <div className="text-sm">
                {order.user?.name && (
                  <p className="font-semibold text-espresso">{order.user.name}</p>
                )}
                {order.user?.email && (
                  <p className="text-espresso-muted">{order.user.email}</p>
                )}
                {order.user?.phone && (
                  <p className="text-espresso-muted">{order.user.phone}</p>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Payment */}
          <AdminCard title="Payment">
            <div className="flex items-start gap-3">
              <CreditCard size={18} className="mt-0.5 shrink-0 text-olive" />
              <div className="text-sm">
                <p className="font-semibold text-espresso">
                  {order.payment?.method ?? "—"}
                </p>
                <div className="mt-1">
                  <StatusBadge
                    status={order.payment?.status ?? order.paymentStatus}
                    tone="payment"
                  />
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Audit note">
            <p className="text-xs leading-relaxed text-espresso-muted">
              Status changes are recorded in the audit log with the admin
              account, timestamp and IP address.
            </p>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
