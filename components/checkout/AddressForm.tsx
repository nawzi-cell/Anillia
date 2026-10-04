"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface AddressFormValues {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
}

export const EMPTY_ADDRESS: AddressFormValues = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
};

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
  "Islamabad Capital Territory",
];

export function validateAddress(v: AddressFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (v.fullName.trim().length < 3) errors.fullName = "Please enter your full name.";
  if (!/^(\+92|0)?3\d{9}$/.test(v.phone.replace(/[\s-]/g, "")))
    errors.phone = "Enter a valid Pakistani mobile number (e.g. 03001234567).";
  if (v.addressLine1.trim().length < 5) errors.addressLine1 = "Please enter your street address.";
  if (v.city.trim().length < 2) errors.city = "Please enter your city.";
  if (!v.province) errors.province = "Please select your province.";
  return errors;
}

export function AddressForm({
  values,
  errors,
  onChange,
}: {
  values: AddressFormValues;
  errors: Record<string, string>;
  onChange: (values: AddressFormValues) => void;
}) {
  const set = (key: keyof AddressFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...values, [key]: e.target.value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" name="fullName" value={values.fullName} onChange={set("fullName")} error={errors.fullName} placeholder="Ayesha Khan" autoComplete="name" />
      <Input label="Phone" name="phone" value={values.phone} onChange={set("phone")} error={errors.phone} placeholder="03001234567" autoComplete="tel" inputMode="tel" />
      <div className="sm:col-span-2">
        <Input label="Address line 1" name="addressLine1" value={values.addressLine1} onChange={set("addressLine1")} error={errors.addressLine1} placeholder="House 12, Street 4" autoComplete="street-address" />
      </div>
      <div className="sm:col-span-2">
        <Input label="Address line 2 (optional)" name="addressLine2" value={values.addressLine2} onChange={set("addressLine2")} placeholder="Apartment, floor, landmark" />
      </div>
      <Input label="City" name="city" value={values.city} onChange={set("city")} error={errors.city} placeholder="Karachi" autoComplete="address-level2" />
      <Select
        label="Province"
        name="province"
        value={values.province}
        onChange={set("province")}
        error={errors.province}
        placeholder="Select province"
        options={PROVINCES.map((p) => ({ value: p, label: p }))}
      />
      <div className="sm:col-span-2">
        <Input label="Postal code (optional)" name="postalCode" value={values.postalCode} onChange={set("postalCode")} placeholder="75500" autoComplete="postal-code" inputMode="numeric" />
      </div>
    </div>
  );
}
