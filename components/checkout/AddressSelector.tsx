"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { apiFetch, type Address } from "@/lib/api/client";
import { AddressForm, EMPTY_ADDRESS, validateAddress, type AddressFormValues } from "./AddressForm";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

export function AddressSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<AddressFormValues>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<Address[]>("/api/addresses")
      .then((data) => {
        if (cancelled) return;
        const list = data ?? [];
        setAddresses(list);
        if (!selectedId) {
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) onSelect(def.id);
          else setShowForm(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setShowForm(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Runs once on mount: picks the default address (or shows the form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveNew = async () => {
    const errs = validateAddress(formValues);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setSaveError("");
    try {
      const created = await apiFetch<Address>("/api/addresses", {
        method: "POST",
        body: {
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.trim(),
          addressLine1: formValues.addressLine1.trim(),
          addressLine2: formValues.addressLine2.trim() || undefined,
          city: formValues.city.trim(),
          province: formValues.province,
          postalCode: formValues.postalCode.trim() || undefined,
        },
      });
      setAddresses((prev) => [...prev, created]);
      onSelect(created.id);
      setShowForm(false);
      setFormValues(EMPTY_ADDRESS);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the address.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((a) => {
        const active = selectedId === a.id && !showForm;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              onSelect(a.id);
              setShowForm(false);
            }}
            aria-pressed={active}
            className={`w-full rounded-2xl border p-5 text-left transition-colors ${
              active ? "border-espresso bg-ivory-light" : "border-espresso/15 hover:border-espresso/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-olive" aria-hidden />
              <div>
                <p className="font-sans text-sm font-semibold text-espresso">
                  {a.fullName} <span className="font-normal text-espresso-muted">· {a.phone}</span>
                </p>
                <p className="mt-1 font-sans text-sm text-espresso-muted">
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.province}
                  {a.postalCode ? ` ${a.postalCode}` : ""}
                </p>
                {a.isDefault && (
                  <span className="mt-2 inline-block rounded-full bg-olive/10 px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-widest2 text-olive-dark">
                    Default
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {showForm ? (
        <div className="rounded-2xl border border-espresso/15 p-5">
          <h3 className="mb-4 font-serif text-lg text-espresso">New address</h3>
          <AddressForm values={formValues} errors={errors} onChange={setFormValues} />
          {saveError && (
            <Alert tone="error" className="mt-4">
              {saveError}
            </Alert>
          )}
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveNew} disabled={saving}>
              {saving ? "Saving…" : "Save & use this address"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            onSelect(null);
            setFormValues(EMPTY_ADDRESS);
            setErrors({});
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-espresso/25 p-5 font-sans text-sm font-semibold text-espresso transition-colors hover:border-espresso"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add a new address
        </button>
      )}
    </div>
  );
}
