"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, UserRound } from "lucide-react";
import { apiFetch, formatPKR, type Order, type Paginated } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatStatus } from "@/components/shared/format";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Paginated<Order>>("/api/orders")
      .then((d) => setOrders((d.items ?? []).slice(0, 3)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Wishlist", value: String(wishlistCount), href: "/wishlist", icon: Heart },
    { label: "Orders", value: loading ? "…" : String(orders.length), href: "/account/orders", icon: Package },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl text-espresso lg:hidden">My account</h1>
      <p className="mt-2 font-sans text-sm text-espresso-muted lg:mt-0">
        Welcome back, {user?.name?.split(" ")[0]}. Here is a snapshot of your ANILLIÉA account.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-espresso/5">
                <c.icon className="h-5 w-5 text-espresso" aria-hidden />
              </span>
              <span>
                <span className="block font-serif text-2xl text-espresso">{c.value}</span>
                <span className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">
                  {c.label}
                </span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-espresso">Recent orders</h2>
          <Link
            href="/account/orders"
            className="group inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso hover:text-taupe-dark"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <p className="font-sans text-sm text-espresso-muted">
              You haven&apos;t placed any orders yet. Your order history will appear here.
            </p>
            <Link href="/shop" className="mt-4 inline-block font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso underline underline-offset-4">
              Start shopping
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
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
                      })}
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

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/account/profile">
          <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-espresso/5">
              <UserRound className="h-5 w-5 text-espresso" aria-hidden />
            </span>
            <span>
              <span className="block font-sans text-sm font-semibold text-espresso">Profile settings</span>
              <span className="font-sans text-xs text-espresso-muted">Name, phone & password</span>
            </span>
          </Card>
        </Link>
        <Link href="/account/addresses">
          <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-espresso/5">
              <MapPin className="h-5 w-5 text-espresso" aria-hidden />
            </span>
            <span>
              <span className="block font-sans text-sm font-semibold text-espresso">Saved addresses</span>
              <span className="font-sans text-xs text-espresso-muted">Manage delivery addresses</span>
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}

