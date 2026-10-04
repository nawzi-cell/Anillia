"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch, type Address } from "@/lib/api/client";
import {
  AddressForm,
  EMPTY_ADDRESS,
  validateAddress,
  type AddressFormValues,
} from "@/components/checkout/AddressForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [values, setValues] = useState<AddressFormValues>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Address[]>("/api/addresses");
      setAddresses(data ?? []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setValues(EMPTY_ADDRESS);
    setErrors({});
    setError("");
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setValues({
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? "",
      city: a.city,
      province: a.province,
      postalCode: a.postalCode ?? "",
    });
    setErrors({});
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    const errs = validateAddress(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    setError("");
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      city: values.city.trim(),
      province: values.province,
      postalCode: values.postalCode.trim() || undefined,
    };
    try {
      if (editing) {
        await apiFetch(`/api/addresses/${editing.id}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/api/addresses", { method: "POST", body: payload });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the address.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
      await load();
    } catch {
      /* keep the list as-is; the delete failed */
    }
  };

  const setDefault = async (id: string) => {
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "PUT", body: { isDefault: true } });
      await load();
    } catch {
      /* no-op */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-espresso">Addresses</h1>
          <p className="mt-2 font-sans text-sm text-espresso-muted">
            Saved delivery addresses for faster checkout.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          Add address
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add your first delivery address to check out faster next time."
          action={<Button onClick={openNew}>Add address</Button>}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
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
              </div>
              <div className="mt-4 flex items-center gap-4 border-t border-espresso/10 pt-4">
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso hover:text-taupe-dark"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted hover:text-red-800"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(a.id)}
                    className="ml-auto font-sans text-xs font-semibold uppercase tracking-widest2 text-olive-dark underline underline-offset-4 hover:text-olive"
                  >
                    Set default
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit address" : "Add address"}
      >
        <AddressForm values={values} errors={errors} onChange={setValues} />
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Add address"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
