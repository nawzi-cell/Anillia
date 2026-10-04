"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { apiFetch, formatPKR, orderAddress, type Order } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { formatStatus } from "@/components/shared/format";

const TIMELINE = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function statusIndex(status: string): number {
  const idx = TIMELINE.indexOf(status.toUpperCase() as (typeof TIMELINE)[number]);
  return idx === -1 ? 0 : idx;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Order>(`/api/orders/${params.id}`)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this order."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Alert tone="error">{error || "Order not found."}</Alert>
        <Link
          href="/account/orders"
          className="mt-4 inline-block font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso underline underline-offset-4"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const cancelled = order.status.toUpperCase() === "CANCELLED";
  const current = statusIndex(order.status);
  const addr = orderAddress(order);

  return (
    <div>
      <Link
        href="/account/orders"
        className="font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted hover:text-espresso"
      >
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-espresso">{order.orderNumber}</h1>
        <Badge tone={cancelled ? "muted" : "olive"}>{formatStatus(order.status)}</Badge>
      </div>
      <p className="mt-2 font-sans text-sm text-espresso-muted">
        Placed on{" "}
        {new Date(order.createdAt).toLocaleDateString("en-PK", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Status timeline */}
      <Card className="mt-6">
        <h2 className="mb-5 font-serif text-xl text-espresso">Order status</h2>
        {cancelled ? (
          <p className="font-sans text-sm text-espresso-muted">
            This order was cancelled. If you need help, contact us at hello@anilliea.pk.
          </p>
        ) : (
          <ol className="space-y-0">
            {TIMELINE.map((s, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={s} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        done
                          ? "bg-olive text-ivory"
                          : active
                            ? "bg-espresso text-ivory"
                            : "bg-espresso/10 text-espresso-muted"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                    </span>
                    {i < TIMELINE.length - 1 && (
                      <span className={`h-8 w-px ${done ? "bg-olive" : "bg-espresso/15"}`} aria-hidden />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`font-sans text-sm ${active ? "font-semibold text-espresso" : "text-espresso-muted"}`}>
                      {formatStatus(s)}
                    </p>
                    {active && (
                      <p className="font-sans text-xs text-espresso-muted">Current stage</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {/* Items */}
      <Card className="mt-6">
        <h2 className="mb-4 font-serif text-xl text-espresso">Items</h2>
        <ul className="divide-y divide-espresso/10">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-sans text-sm font-medium text-espresso">{item.productName}</p>
                {item.variantName && (
                  <p className="font-sans text-xs text-espresso-muted">{item.variantName}</p>
                )}
                <p className="font-sans text-xs text-espresso-muted">Qty {item.quantity}</p>
              </div>
              <p className="font-sans text-sm font-semibold text-espresso">{formatPKR(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <div className="hairline mt-2 space-y-1 pt-4 font-sans text-sm">
          <div className="flex justify-between">
            <span className="text-espresso-muted">Subtotal</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-espresso-muted">Discount</span>
              <span className="text-olive-dark">−{formatPKR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-espresso-muted">Delivery</span>
            <span>{order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold text-espresso">
            <span>Total</span>
            <span>{formatPKR(order.total)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-serif text-xl text-espresso">Delivery address</h2>
          <p className="font-sans text-sm leading-relaxed text-espresso">
            {addr.fullName} · {addr.phone}
            <br />
            <span className="text-espresso-muted">
              {addr.addressLine1}
              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""},{" "}
              {addr.city}, {addr.province}
              {addr.postalCode ? ` ${addr.postalCode}` : ""}
            </span>
          </p>
        </Card>
        <Card>
          <h2 className="mb-3 font-serif text-xl text-espresso">Payment & delivery</h2>
          <p className="font-sans text-sm text-espresso">
            {formatStatus(order.paymentMethod)}
            <br />
            <span className="text-espresso-muted">{formatStatus(order.deliveryMethod)}</span>
          </p>
          {order.notes && (
            <p className="mt-3 font-sans text-sm text-espresso-muted">
              <span className="font-semibold text-espresso">Note: </span>
              {order.notes}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
