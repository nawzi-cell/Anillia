"use client";

import { useEffect, useState, type FormEvent } from "react";
import { User, Lock, Store, AlertTriangle, Mail } from "lucide-react";
import { apiFetch } from "@/components/admin/admin-api";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminInput } from "@/components/admin/AdminInput";
import { AdminButton } from "@/components/admin/AdminButton";
import { LoadingState, ErrorState } from "@/components/admin/Spinner";
import { useToast } from "@/components/admin/Toast";
import { BrandLogo } from "@/components/shared/BrandLogo";

export const dynamic = "force-dynamic";

interface MeResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  };
}

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Email update state
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch<MeResponse>("/api/auth/me");
      setName(d.user.name ?? "");
      setPhone(d.user.phone ?? "");
      setEmail(d.user.email ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !emailCurrentPassword) {
      error("Enter your new email address and current password.");
      return;
    }
    setChangingEmail(true);
    try {
      await apiFetch("/api/admin/change-email", {
        method: "POST",
        body: JSON.stringify({
          newEmail: newEmail.trim(),
          currentPassword: emailCurrentPassword,
        }),
      });
      success("Admin email address updated.");
      setEmail(newEmail.trim().toLowerCase());
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to change email.");
    } finally {
      setChangingEmail(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      success("Profile updated.");
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error("Fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      error("New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <AdminCard>
        <LoadingState label="Loading settings…" />
      </AdminCard>
    );
  }

  if (err) {
    return (
      <>
        <PageHeader title="Settings" />
        <AdminCard>
          <ErrorState message={err} onRetry={() => void load()} />
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your admin account, store details and safety notes."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <AdminCard
          title={
            <span className="inline-flex items-center gap-2">
              <User size={18} className="text-olive" /> Admin profile
            </span>
          }
        >
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <AdminInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <AdminInput label="Current Email" value={email} disabled hint="To change email, use the form below." />
            <AdminInput
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03xx xxxxxxx"
              type="tel"
            />
            <div>
              <AdminButton type="submit" loading={savingProfile}>
                Save profile
              </AdminButton>
            </div>
          </form>
        </AdminCard>

        {/* Change Email */}
        <AdminCard
          title={
            <span className="inline-flex items-center gap-2">
              <Mail size={18} className="text-olive" /> Change admin email
            </span>
          }
        >
          <form onSubmit={handleChangeEmail} className="flex flex-col gap-4">
            <AdminInput
              label="New email address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="newadmin@example.com"
              required
            />
            <AdminInput
              label="Current password"
              type="password"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              placeholder="Confirm your password to update email"
              autoComplete="current-password"
              required
            />
            <div>
              <AdminButton type="submit" loading={changingEmail}>
                Update email
              </AdminButton>
            </div>
          </form>
        </AdminCard>

        {/* Password */}
        <AdminCard
          title={
            <span className="inline-flex items-center gap-2">
              <Lock size={18} className="text-olive" /> Change password
            </span>
          }
        >
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <AdminInput
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <AdminInput
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              hint="At least 8 characters."
            />
            <AdminInput
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div>
              <AdminButton type="submit" loading={changingPassword}>
                Change password
              </AdminButton>
            </div>
          </form>
        </AdminCard>

        {/* Store info */}
        <AdminCard
          title={
            <span className="inline-flex items-center gap-2">
              <Store size={18} className="text-olive" /> Store info
            </span>
          }
        >
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="eyebrow">Brand</dt>
              <dd className="mt-2">
                <BrandLogo
                  href={null}
                  markClassName="h-9 w-auto"
                  wordmarkClassName="text-xl"
                />
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Tagline</dt>
              <dd className="mt-1">Premium modest fashion & everyday essentials</dd>
            </div>
            <div>
              <dt className="eyebrow">Currency</dt>
              <dd className="mt-1">Pakistani Rupee (PKR)</dd>
            </div>
            <div>
              <dt className="eyebrow">Primary market</dt>
              <dd className="mt-1">Pakistan</dd>
            </div>
            <div>
              <dt className="eyebrow">Catalogue</dt>
              <dd className="mt-1">Hijabs, underscarves, accessories & bundles</dd>
            </div>
            <div>
              <dt className="eyebrow">Admin area</dt>
              <dd className="mt-1 font-mono text-xs">/admin</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-espresso/10 pt-3 text-xs text-espresso-muted">
            Storefront content (homepage copy, shipping rates, payment methods)
            is managed by the backend / content teams — this panel covers
            catalogue, orders, customers and marketing.
          </p>
        </AdminCard>

        {/* Danger note */}
        <AdminCard
          title={
            <span className="inline-flex items-center gap-2 text-red-800">
              <AlertTriangle size={18} /> Safety notes
            </span>
          }
        >
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-espresso">
            <li>
              Deleting products, categories or coupons is permanent — the
              server refuses only when live orders reference them.
            </li>
            <li>
              Order status changes notify no one automatically; confirm with
              the customer through your usual channel after updates.
            </li>
            <li>
              Every write action in this panel is recorded in the{" "}
              <span className="font-semibold">Audit Logs</span> with your
              account, timestamp and IP.
            </li>
            <li>
              Always sign out on shared devices — the session cookie grants
              full admin access.
            </li>
          </ul>
        </AdminCard>
      </div>
    </>
  );
}
