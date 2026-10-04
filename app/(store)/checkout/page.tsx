"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatPKR, type Address } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import {
  AddressForm,
  EMPTY_ADDRESS,
  validateAddress,
  type AddressFormValues,
} from "@/components/checkout/AddressForm";
import { DeliveryOptions, DELIVERY_OPTIONS, type DeliveryMethod } from "@/components/checkout/DeliveryOptions";
import { PaymentOptions, type PaymentMethod } from "@/components/checkout/PaymentOptions";
import { OrderSummary } from "@/components/checkout/OrderSummary";

function validateContact(v: { name: string; phone: string; email: string }) {
  const errors: Record<string, string> = {};
  if (v.name.trim().length < 3) errors.name = "Please enter your full name.";
  if (!/^(\+92|0)?3\d{9}$/.test(v.phone.replace(/[\s-]/g, "")))
    errors.phone = "Enter a valid Pakistani mobile number (e.g. 03001234567).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
    errors.email = "Please enter a valid email address.";
  return errors;
}

function SelectedAddressSummary({ addressId }: { addressId: string | null }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  useEffect(() => {
    apiFetch<Address[]>("/api/addresses")
      .then((d) => setAddresses(d ?? []))
      .catch(() => setAddresses([]));
  }, []);
  const a = addresses.find((x) => x.id === addressId);
  if (!a) return <p className="font-sans text-sm text-espresso-muted">No address selected.</p>;
  return (
    <p className="font-sans text-sm leading-relaxed text-espresso">
      {a.fullName} · {a.phone}
      <br />
      <span className="text-espresso-muted">
        {a.addressLine1}
        {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.province}
        {a.postalCode ? ` ${a.postalCode}` : ""}
      </span>
    </p>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-x flex justify-center py-24"><Spinner size="lg" /></div>}>
      <CheckoutFlow />
    </Suspense>
  );
}

function CheckoutFlow() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh } = useCart();

  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [addressId, setAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressFormValues>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  // Prefill contact from the signed-in user
  useEffect(() => {
    if (user) {
      setContact((c) => ({
        name: c.name || user.name || "",
        phone: c.phone,
        email: c.email || user.email || "",
      }));
    }
  }, [user]);

  // Guards: must be signed in, and the bag must not be empty
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // Only signed-in users reach here; guests are sent to login above.
    if (!cartLoading && user && cart.items.length === 0 && !placing) {
      router.replace("/cart");
    }
  }, [cartLoading, cart.items.length, placing, router, user]);

  const net = Math.max(0, cart.subtotal - cart.discount);
  const estimatedFee = useMemo(() => {
    const opt = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethod);
    return opt ? opt.fee(net) : 0;
  }, [deliveryMethod, net]);
  const estimatedTotal = net + estimatedFee;

  const next = () => {
    setPlaceError("");
    if (step === 0) {
      const errs = validateContact(contact);
      setContactErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    if (step === 1) {
      if (useNewAddress) {
        const errs = validateAddress(newAddress);
        setAddressErrors(errs);
        if (Object.keys(errs).length > 0) return;
      } else if (!addressId) {
        setPlaceError("Please select a delivery address.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setPlaceError("");
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError("");
    try {
      const body: Record<string, unknown> = {
        deliveryMethod,
        paymentMethod,
        couponCode: cart.couponCode ?? undefined,
        notes: notes.trim() || undefined,
      };
      if (useNewAddress) {
        body.address = {
          fullName: newAddress.fullName.trim(),
          phone: newAddress.phone.trim(),
          addressLine1: newAddress.addressLine1.trim(),
          addressLine2: newAddress.addressLine2.trim() || undefined,
          city: newAddress.city.trim(),
          province: newAddress.province,
          postalCode: newAddress.postalCode.trim() || undefined,
        };
      } else {
        body.addressId = addressId;
      }
      // POST /api/checkout returns the order fields flat in `data`
      // (201 with the order object, not wrapped in an `order` key).
      const data = await apiFetch<{ id: string; orderNumber: string; total: number }>(
        "/api/checkout",
        { method: "POST", body }
      );
      await refresh();
      router.push(`/order-confirmation?id=${data.id}`);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      setPlacing(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="container-x flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user || cart.items.length === 0) return null;

  const paymentLabel =
    paymentMethod === "COD"
      ? "Cash on Delivery"
      : paymentMethod === "BANK_TRANSFER"
        ? "Bank Transfer"
        : "Online Payment";

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Shopping Bag", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 mt-2 font-serif text-4xl text-espresso md:text-5xl">Checkout</h1>
      <div className="mb-10 max-w-3xl">
        <CheckoutSteps current={step} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Step 1 — Information */}
          {step === 0 && (
            <section aria-label="Contact information">
              <h2 className="mb-5 font-serif text-2xl text-espresso">Contact information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  error={contactErrors.name}
                  placeholder="Ayesha Khan"
                  autoComplete="name"
                />
                <Input
                  label="Phone"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  error={contactErrors.phone}
                  placeholder="03001234567"
                  autoComplete="tel"
                  inputMode="tel"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    error={contactErrors.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 2 — Address */}
          {step === 1 && (
            <section aria-label="Delivery address">
              <h2 className="mb-5 font-serif text-2xl text-espresso">Delivery address</h2>
              <div className="mb-5 flex gap-2 rounded-full bg-espresso/5 p-1">
                {[
                  { id: false, label: "Saved addresses" },
                  { id: true, label: "New address" },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setUseNewAddress(t.id)}
                    aria-pressed={useNewAddress === t.id}
                    className={`flex-1 rounded-full px-4 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest2 transition-colors ${
                      useNewAddress === t.id ? "bg-espresso text-ivory" : "text-espresso-muted hover:text-espresso"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {useNewAddress ? (
                <AddressForm values={newAddress} errors={addressErrors} onChange={setNewAddress} />
              ) : (
                <AddressSelector selectedId={addressId} onSelect={setAddressId} />
              )}
            </section>
          )}

          {/* Step 3 — Delivery */}
          {step === 2 && (
            <section aria-label="Delivery method">
              <h2 className="mb-5 font-serif text-2xl text-espresso">Delivery method</h2>
              <DeliveryOptions value={deliveryMethod} onChange={setDeliveryMethod} subtotal={net} />
            </section>
          )}

          {/* Step 4 — Payment */}
          {step === 3 && (
            <section aria-label="Payment method">
              <h2 className="mb-5 font-serif text-2xl text-espresso">Payment method</h2>
              <PaymentOptions value={paymentMethod} onChange={setPaymentMethod} />
              <div className="mt-5">
                <Textarea
                  label="Order notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything we should know about your delivery?"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </section>
          )}

          {/* Step 5 — Review */}
          {step === 4 && (
            <section aria-label="Review order">
              <h2 className="mb-5 font-serif text-2xl text-espresso">Review your order</h2>
              <div className="space-y-4">
                <ReviewRow
                  title="Contact"
                  onEdit={() => setStep(0)}
                  body={
                    <p className="font-sans text-sm text-espresso">
                      {contact.name} · {contact.phone}
                      <br />
                      <span className="text-espresso-muted">{contact.email}</span>
                    </p>
                  }
                />
                <ReviewRow
                  title="Delivery address"
                  onEdit={() => setStep(1)}
                  body={
                    useNewAddress ? (
                      <p className="font-sans text-sm text-espresso">
                        {newAddress.fullName} · {newAddress.phone}
                        <br />
                        <span className="text-espresso-muted">
                          {newAddress.addressLine1}
                          {newAddress.addressLine2 ? `, ${newAddress.addressLine2}` : ""},{" "}
                          {newAddress.city}, {newAddress.province}
                        </span>
                      </p>
                    ) : (
                      <SelectedAddressSummary addressId={addressId} />
                    )
                  }
                />
                <ReviewRow
                  title="Delivery method"
                  onEdit={() => setStep(2)}
                  body={
                    <p className="font-sans text-sm text-espresso">
                      {deliveryMethod === "STANDARD" ? "Standard Delivery" : "Express Delivery"}
                      <span className="text-espresso-muted">
                        {" "}· {estimatedFee === 0 ? "Free" : formatPKR(estimatedFee)} (estimated)
                      </span>
                    </p>
                  }
                />
                <ReviewRow
                  title="Payment"
                  onEdit={() => setStep(3)}
                  body={<p className="font-sans text-sm text-espresso">{paymentLabel}</p>}
                />
                <div className="rounded-2xl border border-espresso/10 bg-ivory-light p-5">
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-espresso-muted">Subtotal</span>
                    <span>{formatPKR(cart.subtotal)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="mt-1 flex justify-between font-sans text-sm">
                      <span className="text-espresso-muted">Discount</span>
                      <span className="text-olive-dark">−{formatPKR(cart.discount)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between font-sans text-sm">
                    <span className="text-espresso-muted">Delivery (estimated)</span>
                    <span>{estimatedFee === 0 ? "Free" : formatPKR(estimatedFee)}</span>
                  </div>
                  <div className="hairline mt-3 flex justify-between pt-3 font-sans text-base font-semibold text-espresso">
                    <span>Total</span>
                    <span>{formatPKR(estimatedTotal)}</span>
                  </div>
                  <p className="mt-2 font-sans text-xs text-espresso-muted">
                    Final totals are confirmed when your order is placed.
                  </p>
                </div>
              </div>
            </section>
          )}

          {placeError && (
            <Alert tone="error" className="mt-6">
              {placeError}
            </Alert>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            {step > 0 ? (
              <Button variant="ghost" onClick={back} disabled={placing}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <Button onClick={next} disabled={placing}>
                Continue
              </Button>
            ) : (
              <Button onClick={placeOrder} disabled={placing}>
                {placing ? "Placing order…" : `Place order · ${formatPKR(estimatedTotal)}`}
              </Button>
            )}
          </div>
        </div>

        <OrderSummary />
      </div>
    </div>
  );
}

function ReviewRow({
  title,
  body,
  onEdit,
}: {
  title: string;
  body: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-espresso/10 bg-ivory-light p-5">
      <div>
        <h3 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted">
          {title}
        </h3>
        {body}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso underline underline-offset-4 hover:text-taupe-dark"
      >
        Edit
      </button>
    </div>
  );
}
