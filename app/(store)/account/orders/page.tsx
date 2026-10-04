"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { apiFetch, formatPKR, type Order, type Paginated } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { formatStatus } from "@/components/shared/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Paginated<Order>>("/api/orders")
      .then((d) => setOrders(d.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-4xl text-espresso">Orders</h1>
      <p className="mt-2 font-sans text-sm text-espresso-muted">
        Your complete ANILLIÉA order history.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here with tracking updates."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5 transition-shadow hover:shadow-md">
                <div>
                  <p className="font-sans text-sm font-semibold text-espresso">{o.orderNumber}</p>
                  <p className="mt-0.5 font-sans text-xs text-espresso-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {(o.items ?? []).reduce((s, i) => s + i.quantity, 0)} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone="olive">{formatStatus(o.status)}</Badge>
                  <span className="font-sans text-sm font-semibold text-espresso">
                    {formatPKR(o.total)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
