"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { apiFetch, formatPKR, orderAddress, type Order } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container-x flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      }
    >
      <Confirmation />
    </Suspense>
  );
}

function Confirmation() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No order reference was provided.");
      return;
    }
    apiFetch<Order>(`/api/orders/${id}`)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load your order.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container-x flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-x max-w-xl py-16">
        <Alert tone="error">{error || "Order not found."}</Alert>
        <Link href="/shop" className="mt-6 block">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const addr = orderAddress(order);

  return (
    <div className="container-x max-w-3xl pb-16 md:pb-20">
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-olive" aria-hidden />
        <p className="eyebrow mb-3 mt-6">Order confirmed</p>
        <h1 className="font-serif text-4xl text-espresso md:text-5xl">
          Thank you — your order is confirmed
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-espresso-muted">
          We&apos;ve received your order and will begin preparing it shortly.
          You can follow its progress from your account.
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">
              Order number
            </p>
            <p className="mt-1 font-serif text-2xl text-espresso">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">
              Total
            </p>
            <p className="mt-1 font-serif text-2xl text-espresso">{formatPKR(order.total)}</p>
          </div>
        </div>
        <div className="hairline mt-5 grid gap-4 pt-5 sm:grid-cols-3">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">Payment</p>
            <p className="mt-1 font-sans text-sm text-espresso">
              {formatMethod(order.paymentMethod)}
            </p>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">Delivery</p>
            <p className="mt-1 font-sans text-sm text-espresso">
              {formatMethod(order.deliveryMethod)}
            </p>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-widest2 text-espresso-muted">Status</p>
            <p className="mt-1 font-sans text-sm text-espresso">{formatMethod(order.status)}</p>
          </div>
        </div>
      </Card>

      {order.paymentMethod === "BANK_TRANSFER" && (
        <Card className="mb-6">
          <h2 className="mb-3 font-serif text-xl text-espresso">Bank transfer details</h2>
          {order.payment?.metadata?.instructions ? (
            <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-espresso">
              {order.payment.metadata.instructions}
            </p>
          ) : (
            <p className="font-sans text-sm leading-relaxed text-espresso-muted">
              Please contact us at hello@anilliea.pk with your order number and we
              will share the bank account details.
            </p>
          )}
          <p className="mt-3 font-sans text-xs text-espresso-muted">
            Reference: {order.orderNumber} · Amount: {formatPKR(order.total)}
          </p>
        </Card>
      )}

      <Card className="mb-6">
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
              <p className="font-sans text-sm font-semibold text-espresso">
                {formatPKR(item.subtotal)}
              </p>
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

      <Card className="mb-8">
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

      <div className="rounded-2xl bg-olive/10 p-6">
        <h2 className="font-serif text-xl text-espresso">What happens next</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-sm leading-relaxed text-espresso-muted">
          <li>Our team confirms your order and prepares it with care.</li>
          <li>
            {order.paymentMethod === "BANK_TRANSFER"
              ? "Transfer the amount using the reference above — your order ships once the transfer is confirmed."
              : order.paymentMethod === "COD"
                ? "Keep the exact amount ready — you pay in cash when your order arrives."
                : "Your payment is processed securely."}
          </li>
          <li>You receive tracking updates until your parcel reaches your doorstep.</li>
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/shop">
          <Button variant="secondary">Continue shopping</Button>
        </Link>
        <Link href="/account/orders">
          <Button>View my orders</Button>
        </Link>
      </div>
    </div>
  );
}

function formatMethod(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
