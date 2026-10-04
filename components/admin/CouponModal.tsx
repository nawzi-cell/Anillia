"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { AdminInput } from "./AdminInput";
import { AdminSelect } from "./AdminSelect";
import { AdminButton } from "./AdminButton";
import { apiFetch } from "./admin-api";
import { useToast } from "./Toast";
import type { Coupon, CouponType } from "./types";

interface CouponModalProps {
  open: boolean;
  coupon: Coupon | null; // null => create mode
  onClose: () => void;
  onSaved: () => void;
}

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function CouponModal({ open, coupon, onClose, onSaved }: CouponModalProps) {
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (coupon) {
      setCode(coupon.code);
      setType(coupon.type);
      setValue(String(coupon.value));
      setMinimumOrderAmount(
        coupon.minimumOrderAmount != null ? String(coupon.minimumOrderAmount) : "",
      );
      setMaximumDiscount(
        coupon.maximumDiscount != null ? String(coupon.maximumDiscount) : "",
      );
      setUsageLimit(coupon.usageLimit != null ? String(coupon.usageLimit) : "");
      setStartDate(toInputDate(coupon.startDate));
      setExpiryDate(toInputDate(coupon.expiryDate));
      setActive(coupon.active);
    } else {
      setCode("");
      setType("PERCENTAGE");
      setValue("");
      setMinimumOrderAmount("");
      setMaximumDiscount("");
      setUsageLimit("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setExpiryDate("");
      setActive(true);
    }
  }, [open, coupon]);

  const num = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const valueNum = Number(value);
    if (!code.trim()) {
      error("Coupon code is required.");
      return;
    }
    if (Number.isNaN(valueNum) || valueNum <= 0) {
      error("Enter a valid discount value.");
      return;
    }
    if (type === "PERCENTAGE" && valueNum > 100) {
      error("Percentage discounts cannot exceed 100%.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: valueNum,
        minimumOrderAmount: num(minimumOrderAmount),
        maximumDiscount: type === "PERCENTAGE" ? num(maximumDiscount) : null,
        usageLimit: num(usageLimit),
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        active,
      };
      if (coupon) {
        await apiFetch(`/api/admin/coupons/${coupon.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        success("Coupon updated.");
      } else {
        await apiFetch("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        success("Coupon created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={coupon ? "Edit coupon" : "New coupon"}
      wide
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EID20"
            hint="Auto-uppercased. Customers enter this at checkout."
            required
          />
          <AdminSelect
            label="Discount type"
            value={type}
            onChange={(e) => setType(e.target.value as CouponType)}
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed amount (PKR)</option>
          </AdminSelect>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label={type === "PERCENTAGE" ? "Percentage off" : "Discount amount (PKR)"}
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "PERCENTAGE" ? "20" : "500"}
            required
          />
          <AdminInput
            label="Max discount (PKR)"
            type="number"
            min="0"
            step="any"
            value={maximumDiscount}
            onChange={(e) => setMaximumDiscount(e.target.value)}
            hint={type === "PERCENTAGE" ? "Caps percentage discounts." : "Only applies to percentage coupons."}
            disabled={type !== "PERCENTAGE"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Min order amount (PKR)"
            type="number"
            min="0"
            step="any"
            value={minimumOrderAmount}
            onChange={(e) => setMinimumOrderAmount(e.target.value)}
            placeholder="Optional"
          />
          <AdminInput
            label="Usage limit"
            type="number"
            min="1"
            step="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited"
            hint={coupon ? `Used ${coupon.usedCount} time(s) so far.` : undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <AdminInput
            label="Expiry date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            hint="Leave empty for no expiry."
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-espresso">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-[#737963]"
          />
          Coupon is active
        </label>

        <div className="flex justify-end gap-2 border-t border-espresso/10 pt-4">
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" loading={saving}>
            {coupon ? "Save changes" : "Create coupon"}
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}
